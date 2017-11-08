var arrPro = Array.prototype;
var fnPro = Function.prototype;
var errs = ['e', 'err', 'error'];
function fnHasError(fn) {
    var matchs = fnPro.toString.call(fn).match(/\((\w+)/);
    if (!matchs)
        return false;
    return errs.indexOf(matchs[1]) > -1;
}
var Pea = /** @class */ (function () {
    function Pea(beans) {
        var _this = this;
        this.stack = [];
        this.head = 0;
        this.tail = 0;
        if (beans && beans instanceof Array) {
            beans.forEach(function (bean) { return _this.use(bean); });
        }
    }
    Pea.prototype.use = function (bean) {
        var fn;
        if (bean instanceof Pea) {
            fn = function () {
                var pnext = arrPro.pop.apply(arguments);
                bean.use(function () {
                    arrPro.pop.apply(arguments);
                    pnext.apply(this, arguments);
                });
                bean.use(function (e, next) {
                    if (e)
                        pnext(e);
                });
                bean.start.apply(bean, arguments);
            }.bind(this);
        }
        else {
            fn = bean;
        }
        this.tail = this.stack.push(fn);
        return this;
    };
    Pea.prototype.start = function () {
        this.head = 0;
        this.next.apply(this, arguments);
    };
    Pea.prototype.next = function (err) {
        this.run.apply(this, arguments);
    };
    Pea.prototype.run = function () {
        var bean, err;
        var args = arrPro.slice.apply(arguments);
        var first = args[0];
        if (first instanceof Error)
            err = first;
        if (this.head >= this.tail) {
            if (err)
                throw err;
            return;
        }
        while (!err && args.length && first == undefined) {
            args.shift();
            first = args[0];
        }
        bean = this.stack[this.head++];
        if ((err && fnHasError(bean)) || (!err && !fnHasError(bean))) {
            args.push(this.next.bind(this));
            try {
                return void bean.apply(this, args);
            }
            catch (e) {
                err = e;
            }
        }
        this.next(err);
    };
    return Pea;
}());
