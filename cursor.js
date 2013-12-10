var Cursor = (function($) {

    var D_HOLDER_ID = 'data-holder-id';
    var ADD_THRESHOLD = 500;
    var REMOVE_THRESHOLD = 1000;

    function Cursor(options) {
        this._get = options.get;
        this._container = $(options.container);
        this._stack = [];
        this._stackContainer = createStackContainer().appendTo(this._container);
        this._bindEvents();

        this._scheduledCheck = _.debounce(this._check, 100);
        this._scheduledCheckPush = _.debounce(this._checkPush, 100);
        this._scheduledCheckPop = _.debounce(this._checkPop, 100);
        this._scheduledCheckShift = _.debounce(this._checkShift, 100);
    }

    var proto = Cursor.prototype;

    proto.render = function() {
        this.pushChunk(0);
    };

    proto._bindEvents = function() {
        this._container.on('scroll', function(e) {
            if (this._scrollLocked) {
                console.log('NO scroll event - locked');
            }
            if (this._isRequesting) {
                console.log('NO scroll event - requesting');
            }
            console.log('scroll event');
            this._check();
        }.bind(this));
    };

    proto._push = function(id, holder) {
        var last = this._last();

        this._scrollLock(function() {
            if (last) {
                this._scrollCorrect(last.holder, function() {
                    this._stackContainer.append(holder);
                });
            } else {
                this._stackContainer.append(holder);
            }
        });


        this._stack.push({
            id: id,
            holder: holder
        });
    };

    proto._pop = function() {
        var last = this._last();
        this._scrollLock(function() {
            last.holder.remove();
        });
        this._stack.pop();
    };

    proto._shift = function() {
        var first = this._first();
        var second = this._second();
        // var deltaHeight = first.holder.outerHeight();

        this._scrollLock(function() {
            this._scrollCorrect(second.holder, function() {
                first.holder.remove();
            });
        });

        this._stack.shift();
    };

    proto._scrollLock = function(modifier) {
        clearTimeout(this._scrollUnlockTimeout);
        this._scrollLocked = true;
        console.log('scroll LOCKED');
        modifier.call(this);
        this._scrollUnlockTimeout = setTimeout(function() {
            console.log('scroll UNLOCKED');
            this._scrollLocked = false;
        }.bind(this), 1000);
    };

    proto._scrollCorrect = function(anchor, modifier) {
        var topBefore = anchor.position().top;
        modifier.call(this);
        var topAfter = anchor.position().top;
        var scrollCorrection = topAfter - topBefore;
        console.log('scrollCorrection:', scrollCorrection);
        this._stackContainer.scrollTop(this._stackContainer.scrollTop() - scrollCorrection);
    };

    proto.pushChunk = function(id) {
        this._isRequesting = true;
        this._get(id, function(err, chunk) {
            this._isRequesting = false;
            if (err) {
                throw ('Error getting chunk');
            }

            this._push(id, createHolder(id, chunk));
            this._scheduledCheckPush();
        }.bind(this));
    };

    proto.popChunk = function(id) {
        this._pop();
        this._scheduledCheck();
    };

    proto.shiftChunk = function(id) {
        this._shift();
        this._scheduledCheck();
    };

    proto._last = function() {
        return this._stack[this._stack.length - 1] || false;
    };

    proto._first = function() {
        return this._stack[0] || false;
    };

    proto._second = function() {
        return this._stack[1] || false;
    };

    proto._needsPush = function() {
        var bottom = this._stackContainer.position().top + this._stackContainer.outerHeight();
        var max = this._container.innerHeight();
        if (max > bottom - ADD_THRESHOLD) {
            return true;
        }

        return false;
    };

    proto._needsPop = function() {
        var last = this._last();
        var top = last.holder.position().top;
        var max = this._container.innerHeight();
        if (max < top - REMOVE_THRESHOLD) {
            return true;
        }

        return false;
    };

    proto._needsUnshift = function() {
        var top = this._stackContainer.position().top;
        var min = 0;
        if (min < top) {
            return true;
        }

        return false;
    };

    proto._needsShift = function() {
        var first = this._first().holder;
        var bottom = this._stackContainer.position().top + first.outerHeight();
        var min = 0;
        if (min > bottom + REMOVE_THRESHOLD) {
            return true;
        }

        return false;
    };

    proto._checkPush = function() {
        if (this._needsPush()) {
            console.log('_needsPush');
            var last = this._last();
            this.pushChunk(last.id + 1);
            return true;
        }
        return false;
    }

    proto._checkPop = function() {
        if (this._needsPop()) {
            console.log('_needsPop');
            this.popChunk();
            return true;
        }
        return false;
    }

    proto._checkShift = function() {
        if (this._needsShift()) {
            console.log('_needsShift');
            this.shiftChunk();
            return true;
        }
        return false;
    }


    proto._check = function() {
        if (this._checkPush()) {
            return;
        }
        if (this._checkPop()) {
            return;
        }
        if (this._checkShift()) {
            return;
        }

        // if (this._needsUnshift()) {
        //     console.log('_needsUnshift');
        //     var first = this._first();
        //     return this.unshiftChunk(first.id - 1);
        // }

    };

    // proto._scheduledCheck = function() {
    //     clearTimeout(this._checkTimeout);
    //     this._checkTimeout = setTimeout(this._check.bind(this), 100);
    // };


    function createHolder(id, chunk) {
        return $('<div class="holder">').attr(D_HOLDER_ID, id).html(chunk);
    }

    function createStackContainer() {
        return $('<div class="stack">');
    }

    return Cursor;

})(jQuery);