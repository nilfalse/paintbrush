var paintbrush = (function(window, undefined) {
    // Примитивы
    function Line(x1, y1, x2, y2) {
        if (!(this instanceof Line)) {
            return new Line(x1, y1, x2, y2);
        }

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = null;
        this.size = null;
    }
    Line.prototype.draw = function Line_draw(ctx) {
        ctx.lineWidth = this.size;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
        ctx.closePath();
    };

    function Rect(x1, y1, x2, y2) {
        if (!(this instanceof Rect)) {
            return new Rect(x1, y1, x2, y2);
        }

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.color = null;
        this.size = null;
    }
    Rect.prototype.draw = function Rect_draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    };

    var serviceLocator = {
        // Определяет примитив, который пользователь захотел нарисовать.
        // В первом приближении алгоритм простой: с шифтом рисуем прямоугольники, иначе – линии.
        getDrawableForEvent: function(e) {
            return e.shiftKey ? Rect : Line;
        }
    };

    // Цвета в первой версии заданы внутри <select>, этот объект с ним работает.
    var colorpalette = ({
        // ссылка на <select>
        _node: null,
        // текущий выбранный цвет
        currentColor: null,

        init: function colorpicker_init(node) {
            var that = this;
            this._node = node;
            this.currentColor = node.value;
            node.onchange = function colorpicker_handleonchange(e) {
                that.currentColor = node.value;
            };
            return this;
        }
    }.init(document.getElementById('color')));

    // Конфигурация кисточки. В первой версии только размер.
    var brush = ({
        size: null,
        init: function brush_init(node) {
            var that = this;
            this.size = node.valueAsNumber;
            node.onchange = function brush_handleonchange(e) {
                that.size = node.valueAsNumber;
            };
            return this;
        }
    }.init(document.getElementById('size')));

    // Главный объект приложения (синглтон)
    var paintbrush = {
        canvas: null,
        ctx: null,
        // список уже нарисованных ранее примитивов
        drawn: [],
        // текщий рисуемый примитив
        pending: null,

        init: function paintbrush_init(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            canvas.onmousemove = this._onmove.bind(this);
            canvas.onmousedown = this._onstart.bind(this);
            canvas.onmouseup = this._onstop.bind(this);

            return this;
        },
        redraw: function paintbrush_redraw() {
            var ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
            this.drawn.forEach(function(drawable) {
                drawable.draw(ctx);
            });
        },

        _onstart: function paintbrush__onstart(e) {
            var Drawable = serviceLocator.getDrawableForEvent(e);
            this.pending = new Drawable(e.offsetX, e.offsetY);
            this.pending.color = colorpalette.currentColor;
            this.pending.size = brush.size;
        },
        _onmove: function paintbrush__onmove(e) {
            if (!this.pending) {
                return;
            }

            this.redraw();
            var drawable = this.pending;
            drawable.x2 = e.offsetX;
            drawable.y2 = e.offsetY;
            drawable.draw(this.ctx);
        },
        _onstop: function paintbrush__onstop(e) {
            var drawable = this.pending;
            this.pending = null;

            if (!drawable) {
                return;
            }
            if (!drawable.x2 || !drawable.y2) {
                // простой клик не генерирует mousemove – рисовать нечего
                return;
            }
            this.drawn.push(drawable);
        }
    };

    return paintbrush.init(document.getElementById('canvas'));
}(this));
