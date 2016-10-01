var paintbrush = (function(window, undefined) {
    // Примитивы
    function Curve(x1, y1) {
        this.points = [];
        this.x1 = x1;
        this.y1 = y1;
        this.canDraw = false;
        this.color = null;
        this.size = null;
    }
    Curve.hasSize = true;
    Curve.prototype.capturePoint = function Curve_capturePoint(x, y) {
        this.points.push({ x: x, y: y });
        this.canDraw = true;
    };
    Curve.prototype.draw = function Curve_draw(ctx) {
        ctx.lineWidth = this.size;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        this.points.forEach(function(p) {
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.closePath();
    };

    function Line(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.canDraw = false;
        this.color = null;
        this.size = null;
    }
    Line.hasSize = true;
    Line.prototype.capturePoint = function Line_capturePoint(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.canDraw = true;
    };
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
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.canDraw = false;
        this.color = null;
        this.size = null;
    }
    Rect.hasSize = false;
    Rect.prototype.capturePoint = function Rect_capturePoint(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.canDraw = true;
    };
    Rect.prototype.draw = function Rect_draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    };

    function Circle(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.canDraw = false;
        this.color = null;
        this.size = null;
    }
    Circle.hasSize = false;
    Circle.prototype.capturePoint = function Circle_capturePoint(x, y) {
        this.x2 = x;
        this.y2 = y;
        this.canDraw = true;
    };
    Circle.prototype.drawEllipse = function Circle_drawEllipse(ctx, x, y, a, b) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.scale(a / b, 1);
        ctx.arc(0, 0, Math.abs(b), 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.restore();
    };
    Circle.prototype.draw = function Circle_draw(ctx) {
        var x = (this.x1 + this.x2) / 2;
        var y = (this.y1 + this.y2) / 2;
        var a = (this.x2 - this.x1) / 2;
        var b = (this.y2 - this.y1) / 2;
        ctx.fillStyle = this.color;
        this.drawEllipse(ctx, x, y, a, b);
        ctx.fill();
    };

    // Конфигурация кисточки.
    var brush = {
        currentColor: null,
        currentSize: null,
        selectedTool: null,

        toolbar: null,
        tools: [],
        selectTool: function tool_selectTool(tool) {
            switch(tool) {
            case 'curve': this.selectedTool = Curve; break;
            case 'line': this.selectedTool = Line; break;
            case 'rect': this.selectedTool = Rect; break;
            case 'circle': this.selectedTool = Circle; break;
            default: console.warn('unknown tool'); return;
            }
            this.toolbar.querySelector('#size-toolbar').style.visibility =
                this.selectedTool.hasSize ? '' : 'hidden';
        },
        colors: [],
        selectColor: function tool_selectColor(color) {
            this.currentColor = color;
            this.toolbar.querySelector('#current-color').style.backgroundColor = color;
        },

        init: function brush_init(toolbar) {
            var that = this;
            this.toolbar = toolbar;

            function unselectAll(items) {
                items.forEach(function(item) { item.classList.remove('selected') });
            }

            this.tools = Array.from(toolbar.querySelectorAll('#toolbox li'));
            this.tools.forEach(function(tool) {
                var toolname = tool.dataset.tool;
                tool.onclick = function(e) {
                    unselectAll(that.tools);
                    tool.classList.add('selected');
                    that.selectTool(toolname, e);
                };
                if (!that.selectedTool) {
                    tool.classList.add('selected');
                    that.selectTool(toolname);
                }
            });

            this.colors = Array.from(toolbar.querySelectorAll('#colorpalette li'));
            this.colors.forEach(function(color) {
                var colorname = color.className.replace('color__', '');
                color.onclick = function(e) {
                    unselectAll(that.colors);
                    color.classList.add('selected');
                    that.selectColor(colorname);
                };
                if (!that.currentColor) {
                    color.classList.add('selected');
                    that.selectColor(colorname);
                }
            });

            var size = toolbar.querySelector('#size');
            this.currentSize = size.valueAsNumber;
            size.onchange = function (e) {
                that.currentSize = size.valueAsNumber;
            };

            return this;
        }
    };

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
            this.pending = new brush.selectedTool(e.offsetX, e.offsetY);
            this.pending.color = brush.currentColor;
            this.pending.size = brush.currentSize;
        },
        _onmove: function paintbrush__onmove(e) {
            if (!this.pending) {
                return;
            }

            this.redraw();
            var drawable = this.pending;
            drawable.capturePoint(e.offsetX, e.offsetY);
            drawable.draw(this.ctx);
        },
        _onstop: function paintbrush__onstop(e) {
            var drawable = this.pending;
            this.pending = null;

            if (!drawable) {
                return;
            }
            if (!drawable.canDraw) {
                return;
            }
            this.drawn.push(drawable);
        }
    };

    brush.init(document.getElementById('toolbar'));
    return paintbrush.init(document.getElementById('canvas'));
}(this));
