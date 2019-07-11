/**
 * 给canvas绘制圆形边框的插件
 * 
 * @param {object} opts 通过WaveLoading实例的usePlugin方法调用的第二个参数
 * @param {number} opts.lineWidth 边框线条宽度，默认是2
 * @param {string} opts.lineColor 边框线条颜色，默认是WaveLoading实例的波浪背景色 
 */
export default {
    hook: 'duringProgress',
    install({ ctx, configs }, opts={}) {
        ctx.beginPath()
        ctx.lineWidth = (opts && opts.lineWidth) || 2
        ctx.strokeStyle = (opts && opts.lineColor) || `rgba(${configs.waveCharactor.color}, 1)`
        const r = Math.min(configs.canvasWidth, configs.canvasHeight) / 2
        ctx.arc(r, r, r + 1, 0, 2 * Math.PI)
        ctx.stroke()
        // ctx.beginPath()
        // ctx.arc(r, r, r, 0, 2 * Math.PI)
    }
}