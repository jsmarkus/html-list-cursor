var Cursor = (function($) {

    var D_HOLDER_ID = 'data-holder-id';
    var POP_THRESHOLD = 100;

    function Cursor(options) {
        this._get = options.get;
        this._container = $(options.container);
        this._stack = [];
        this._stackContainer = createStackContainer().appendTo(this._container);
        this._bindEvents();
    }

    var proto = Cursor.prototype;

    proto.render = function() {
        this.pushChunk(0);
    };

    proto._bindEvents = function() {
        this._container.on('scroll', function (e) {
            this._check();
        }.bind(this));
    };

    proto._push = function(id, holder) {
        this._stackContainer.append(holder);
        this._stack.push({
            id: id,
            holder: holder
        });
    };

    proto._pop = function() {
        var last = this._last();
        last.holder.remove();
        this._stack.pop();
    };

    proto.pushChunk = function(id) {
        this._get(id, function(err, chunk) {
            if (err) {
                throw ('Error getting chunk');
            }

            this._push(id, createHolder(id, chunk));
            this._check();
        }.bind(this));
    };

    proto.popChunk = function(id) {
        this._pop();
        this._check();
    };

    proto._last = function() {
        return this._stack[this._stack.length - 1] || false;
    }

    proto._first = function() {
        return this._stack[0] || false;
    }

    proto._needsPush = function() {
        var bottom = this._stackContainer.position().top + this._stackContainer.outerHeight();
        var max = this._container.innerHeight();
        if (max > bottom) {
            return true;
        }

        return false;
    };

    proto._needsPop = function() {
        var last = this._last();
        var top = last.holder.position().top;
        var max = this._container.innerHeight();
        if (max < top - POP_THRESHOLD) {
            return true;
        }

        return false;
    };

    proto._needsUnshift = function() {
        //TODO
        return false;
    };

    proto._check = function() {
        if (this._needsPush()) {
            console.log('_needsPush');
            var last = this._last();
            return this.pushChunk(last.id + 1);
        }

        if (this._needsPop()) {
            console.log('_needsPop');
            return this.popChunk();
        }

        if (this._needsUnshift()) {
            console.log('_needsUnshift');
            var first = this._first();
            return this.unshiftChunk(first.id - 1);
        }
    };


    function createHolder(id, chunk) {
        return $('<div class="holder">').attr(D_HOLDER_ID, id).html(chunk);
    }

    function createStackContainer() {
        return $('<div class="stack">');
    }

    return Cursor;

})(jQuery);