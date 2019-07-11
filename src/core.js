import {
    INITIAL_RANGE,
    WAVE_SPEED,
    PROGRESS_SPEED,
    WAVE_WIDTH,
    WAVE_HEIGHT
} from './constant'

export default class WaveProgress {
    /**
     * @constructor 
     *  @param {object} opts
     *  @param {string|object} opts.dom 宿主canvas，可以是id或class名称，必选
     *  @param {number} opts.progress 初始的进度，0~100，可选，默认为0
     *  @param {number} opts.waveSpeed 波浪横轴的运动速度，可选，默认为0.05，建议0.01~0.2
     *  @param {number} opts.progressSpeed 波浪纵轴的运动速度，可选，默认为0.6，取值大于0即可
     *  @param {object} opts.waveCharactor 波浪外观配置对象，可选
     *  @param {number} opts.waveCharactor.number 波浪的数量，默认是1，只能是1，2，3三者之一
     *  @param {string} opts.waveCharactor.color 波浪的背景颜色，默认是'24, 133, 249'，只能是rgb颜色字符串
     *  @param {number} opts.waveCharactor.waveWidth 波浪宽度,数越小越宽，默认是0.02
     *  @param {number} opts.waveCharactor.waveHeight 波浪高度,数越大越高，默认是18
     */
    constructor({ dom, progress = INITIAL_RANGE, waveSpeed = WAVE_SPEED, progressSpeed = PROGRESS_SPEED, waveCharactor = {} } = {}) {
        if (arguments.length == 0) {
            throw new Error('expect object, the param must be an object')
        }
        if (dom === undefined) {
            throw new Error('canvas dom is required')
        }

        this._init({
            dom,
            progress,
            waveSpeed,
            progressSpeed,
            waveCharactor
        })
    }

    /**
     * 初始化配置参数
     * 
     * @private
     */
    _init({ dom, progress, waveSpeed, progressSpeed, waveCharactor }) {
        this.canvas = document.querySelector(dom)
        this.ctx = this.canvas.getContext('2d')
        let canvasWidth, canvasHeight

        if (getComputedStyle(this.canvas)['width']) {
            canvasWidth = Number.parseFloat(getComputedStyle(this.canvas)['width']) * 1
        }

        if (getComputedStyle(this.canvas)['height']) {
            canvasHeight = Number.parseFloat(getComputedStyle(this.canvas)['height']) * 1
        }

        this.canvas.width = canvasWidth
        this.canvas.height = canvasHeight
        const axisLength = canvasWidth
        const INITIAL_CONFIGS = {
            canvasWidth,
            canvasHeight,
            // sin属性
            sX: 0,
            axisLength,
            xOffset: 0,
            yOffset: INITIAL_RANGE,
            progress,
            animationID: 0,
            waveSpeed,
            progressSpeed,
            waveCharactor: {
                number: 1,
                color: '24, 133, 249',
                waveWidth: WAVE_WIDTH,
                waveHeight: WAVE_HEIGHT,
                ...waveCharactor
            }
        }

        /**
         * seal封闭实例的configs对象，为了避免开发者调用时删除已有数据导致出错，也禁止给configs新增数据，只能修改已有数据！
         */
        this.configs = Object.seal(INITIAL_CONFIGS)

        this.plugins = {
            'beforeProgress': [],
            'beforeProgress:render': [],
            'beforeProgress:setProgress': [],
            'progressing': [],
            'afterProgress': [],
            'duringProgress': [],
            'update': []
        }
    }

    /**
     * 触发插件的执行函数
     * 
     * @private 
     */
    _triggerPlugin(hook) {
        this.plugins[hook].forEach(item => {
            item.action.call(this, {
                ctx: this.ctx,
                // 回调函数返回深拷贝数据，避免插件通过configs修改已有数据
                configs: JSON.parse(JSON.stringify(this.configs)),
                scopedData: this._scopedData(hook, item.id)
            }, item.params)
        })
    }

    /**
     * 返回对指定插件的作用域数据的get和set操作
     * 
     * @private
     */
    _scopedData(hook, id) {
        const res = {
            get: () => {
                return this.plugins[hook].find(item => item.id == id).scopedData
            },
            set: (data) => {
                this.plugins[hook].find(item => item.id == id).scopedData = data
            }
        }
        return res
    }

    /**
     * 绘制波浪sin函数曲线
     * 
     * @private
     */
    _drawSin(xOffset, color, waveHeight, ctx, sX, axisLength, waveWidth, mH, nowRange) {
        ctx.save()

        let points = []  //用于存放绘制Sin曲线的点

        ctx.beginPath()
        //在整个轴长上取点
        for (let x = sX; x < sX + axisLength; x += 20 / axisLength) {
            //此处坐标(x,y)的取点，依靠公式 “振幅高*sin(x*振幅宽 + 振幅偏移量)”
            let y = Math.sin((-sX - x) * waveWidth + xOffset) * 0.8 + 0.1

            let dY = mH * (1 - nowRange / 100)

            points.push([x, dY + y * waveHeight])
            ctx.lineTo(x, dY + y * waveHeight)
        }

        //封闭路径
        ctx.lineTo(axisLength, mH)
        ctx.lineTo(sX, mH)
        ctx.lineTo(points[0][0], points[0][1])
        ctx.fillStyle = color
        ctx.fill()

        ctx.restore()
    }

    /**
     * 绘制波浪的核心函数
     * 
     * @private
     */
    _render({ progress, initialRange, animated } = {}) {
        this.configs.yOffset = initialRange
        const ctx = this.ctx
        const mW = this.configs.canvasWidth
        const mH = this.configs.canvasHeight
        const sX = this.configs.sX
        const axisLength = this.configs.axisLength
        let xOffset = this.configs.xOffset
        let yOffset = animated === false ? progress : initialRange
        const waveSpeed = this.configs.waveSpeed
        const progressSpeed = this.configs.progressSpeed

        const waveWidth = this.configs.waveCharactor.waveWidth
        const waveHeight = this.configs.waveCharactor.waveHeight
        const waveNumber = this.configs.waveCharactor.number
        const waveColor = this.configs.waveCharactor.color

        ctx.clearRect(0, 0, mW, mH)
        switch (waveNumber) {
            case 1:
                this._drawSin(xOffset, `rgba(${waveColor}, 0.9)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                break
            case 2:
                this._drawSin(xOffset + Math.PI * 0.5, `rgba(${waveColor}, 0.5)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                this._drawSin(xOffset, `rgba(${waveColor}, 0.9)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                break
            case 3:
                this._drawSin(xOffset + Math.PI * 0.5, `rgba(${waveColor}, 0.5)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                this._drawSin(xOffset, `rgba(${waveColor}, 0.7)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                this._drawSin(xOffset - Math.PI * 0.5, `rgba(${waveColor}, 0.9)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
                break
            default:
                this._drawSin(xOffset, `rgba(${waveColor}, 0.9)`, waveHeight, ctx, sX, axisLength, waveWidth, mH, yOffset)
        }

        this.configs.xOffset += waveSpeed
        if (yOffset < progress) {
            this.configs.yOffset += progressSpeed
            // progressing和duringProgress钩子执行
            this._triggerPlugin('progressing')
            this._triggerPlugin('duringProgress')
        }
        // 处理progress和yOffset的差值不等于progressSpeed的情况
        else if (Math.abs(yOffset - progress) <= progressSpeed) {
            this.configs.yOffset = progress
            // afterProgress和duringProgress钩子执行
            this._triggerPlugin('afterProgress')
            this._triggerPlugin('duringProgress')
        }
        else if (yOffset > progress) {
            this.configs.yOffset -= progressSpeed
            // progressing和duringProgress钩子执行
            this._triggerPlugin('progressing')
            this._triggerPlugin('duringProgress')
        }
        this.configs.animationID = window.requestAnimationFrame(() => {
            this._render({ progress, initialRange: this.configs.yOffset, animated })
        })
    }

    /**
     * 渲染数据到画布，初始化实例后，必须调用
     * 
     * @param {boolean} animated 是否开启动画，可选，默认为true
     */
    render(animated) {
        // beforeProgress、beforeProgress:render和duringProgress钩子执行
        this._triggerPlugin('beforeProgress')
        this._triggerPlugin('beforeProgress:render')
        this._triggerPlugin('duringProgress')

        window.cancelAnimationFrame(this.configs.animationID)
        this._render({
            progress: this.configs.progress,
            initialRange: this.configs.yOffset,
            animated
        })
    }

    /**
     * 动态改变波浪的纵向高度，即改变进度。
     * 
     * @param {object} opts
     * @param {number} opts.to 结束进度值，可选，默认为当前进度
     * @param {number} opts.from 开始进度值，可选，默认为当前进度。改变from的值可以重置进度的动画效果
     * @param {boolean} opts.animated 是否开启动画，可选，默认为true
     * @returns {WaveProgress} 返回实例本身 
     */
    setProgress({ to = this.configs.progress, from = this.configs.yOffset, animated = true } = {}) {
        if (arguments.length == 0) {
            throw new Error('expect object, the param must be an object')
        }
        // beforeProgress、beforeProgress:setProgress和duringProgress钩子执行
        this._triggerPlugin('beforeProgress:setProgress')
        this._triggerPlugin('beforeProgress')
        this._triggerPlugin('duringProgress')

        window.cancelAnimationFrame(this.configs.animationID)
        this.configs.progress = to
        this._render({
            progress: to,
            initialRange: from,
            animated
        })

        return this
    }

    /**
     * 更新实例的配置项
     * 
     * @param {object} opts
     * @param {number} opts.waveSpeed 波浪横轴的运动速度，同构造器参数
     * @param {number} opts.progressSpeed 波浪纵轴的运动速度，同构造器参数
     * @param {object} opts.waveCharactor 波浪外观配置对象，，同构造器参数
     * @returns {WaveProgress} 返回实例本身 
     */
    update({ waveSpeed, progressSpeed, waveCharactor } = {}) {
        if (typeof waveSpeed == 'number') {
            this.configs.waveSpeed = waveSpeed
        }
        if (typeof progressSpeed == 'number') {
            this.configs.progressSpeed = progressSpeed
        }
        if (Object.prototype.toString.call(waveCharactor) == '[object Object]') {
            this.configs.waveCharactor = { ...this.configs.waveCharactor, ...waveCharactor }
        }
        // update和duringProgres钩子执行
        this._triggerPlugin('update')
        this._triggerPlugin('duringProgress')

        return this
    }

    /**
     * 注册插件，插件会和生命周期钩子结合在一起
     * 
     * @param {object} plugin
     * @param {string} plugin.hook 生命周期名称，只能是beforeProgress,progressing,afterProgress,duringProgress,update其中之一，否则报错
     * @param {function} plugin.install 插件的执行函数，返回2个形参
     * @param {number} opts 传入插件执行函数的参数
     * @returns {WaveProgress} 返回实例本身
     */
    usePlugin(plugin, opts) {
        const hooks = Object.keys(this.plugins)
        if (hooks.includes(plugin.hook)) {
            const pluginFnStrList = this.plugins[plugin.hook].map(item => item.toString())
            // 拦截同一个插件重估调用
            if (!pluginFnStrList.includes(plugin.install.toString())) {
                this.plugins[plugin.hook].push({
                    id: Symbol(),
                    action: plugin.install,
                    params: opts,
                    scopedData: null
                })
            }
            return this
        }
        else {
            throw new Error('hook name is ivalid，expected with beforeProgress or progressing or afterProgress')
        }
    }
}