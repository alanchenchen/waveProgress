/**
 * 在波浪的中间位置实时显示百分比信息文本的插件
 * 
 * @param {object} opts 通过WaveLoading实例的usePlugin方法调用的第二个参数
 * @param {string} opts.textAlign 文本对齐方式，默认是center
 * @param {number} opts.fontSize 文本大小，默认是26
 * @param {string} opts.color 文本颜色，默认当进度小于50%时为WaveLoading实例的波浪背景色 ，大于50%时是#fff
 */
export default {
    hook: 'duringProgress',
    install({ ctx, configs }, opts = {}) {
        ctx.save()

        const centerPadding = configs.canvasHeight / 2
        const size = opts.fontSize || 26
        ctx.font = size + 'px Microsoft Yahei'
        ctx.textAlign = opts.textAlign || 'center'
        if (configs.yOffset >= 50) {
            ctx.fillStyle = '#fff'
        } else {
            ctx.fillStyle = opts.color || `rgba(${configs.waveCharactor.color}, 0.9)`
        }

        ctx.fillText(configs.yOffset.toFixed(1) + '%', centerPadding, centerPadding + size / 2)

        ctx.restore()
    }
}