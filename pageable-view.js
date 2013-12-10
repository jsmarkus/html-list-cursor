var PageableView = (function() {
    var S_IDLE = 'S_IDLE';
    var S_LOADING = 'S_LOADING';
    var S_SCROLLING = 'S_SCROLLING';

    var TIMEOUT_SCROLL = 1000;


    function PageableView(options) {
        this._onRead = options.read;
        this._container = $(options.container);
        this._pageSize = options.pageSize;
        this._pages = {};
        this._domPages = {};
        this._state = S_IDLE;
        this._bind();
    }

    var proto = PageableView.prototype;

    proto.seek = function(index) {
        var pIndex = this._itemIndexToPageIndex(index);

        var pagesToLoad = this._getPagesToLoad(pIndex);
        var pagesToUnload = this._getPagesToUnload(pIndex);

        console.log('index, pIndex:', index, pIndex);
        console.log('pagesToLoad:', pagesToLoad);
        console.log('pagesToUnload:', pagesToUnload);

        this._setState(S_LOADING);
        this._loadPages(pagesToLoad, _.bind(function() {
            for (var i = 0; i < pagesToLoad.length; i++) {
                var pI = pagesToLoad[i];
                var $pg = this._renderPage(pI);
                console.log($pg);
                this._domInsertPage(pI, $pg);
            }
            this._domScrollTo(pIndex, index);
            _.delay(_.bind(this._setState, this, S_IDLE), 100);
        }, this));
    };

    proto._setState = function(state) {
        console.log('STATE:', this._state, '->', state);
        this._state = state;
    };

    proto._bind = function() {
        var comeBackIdle = _.bind(function () {
            this._setState(S_IDLE);
            this._onScrollEnd();
        }, this);
        var comeBackTimeout;

        this._container.on('scroll', _.bind(function(event) {
            if (this._state === S_IDLE) {
                this._setState(S_SCROLLING);
                comeBackTimeout = setTimeout(comeBackIdle, TIMEOUT_SCROLL);
            }
            if (this._state === S_SCROLLING) {
                clearTimeout(comeBackTimeout);
                comeBackTimeout = setTimeout(comeBackIdle, TIMEOUT_SCROLL);
            }

        }, this));
    };

    proto._onScrollEnd = function() {
        var coords = this._domGetCurrentItemCoordinates();
        console.log('scrolled to:', coords);
        this.seek(coords[0]);
    };

    proto._loadPages = function(pIndices, cb) {
        var self = this;

        async.map(pIndices, function(pIndex, next) {
            self._loadPage(pIndex, next);
        }, cb);
    };

    proto._getPagesToUnload = function(seekPIndex) {
        var pIndices = this._getPageIndices();
        return _.reject(pIndices, function(loadedPIndex) {
            loadedPIndex = 1 * loadedPIndex;
            return (loadedPIndex < seekPIndex - 1) || (loadedPIndex > seekPIndex + 1);
        });
    };

    proto._getPagesToLoad = function(seekPIndex) {
        var pIndices = [seekPIndex - 1, seekPIndex, seekPIndex + 1];
        return _.reject(pIndices, function(pIndex) {
            if (pIndex < 0) {
                return true;
            }
            if (this._hasPage(pIndex)) {
                return true;
            }
            return false;
        }, this);
    };

    proto._itemIndexToPageIndex = function(index) {
        var pIndex = Math.floor(index / this._pageSize);
        return pIndex;
    };

    proto._pageIndexToPageRange = function(pIndex) {
        var pstart = pIndex * this._pageSize;
        var pend = pstart + this._pageSize;
        return [pstart, pend];
    };

    proto._loadPage = function(pIndex, cb) {
        if (this._hasPage(pIndex)) {
            return cb(null);
        }
        var pRange = this._pageIndexToPageRange(pIndex);
        this._onRead(pRange[0], pRange[1], _.bind(function(err, items) {
            if (err) {
                cb(err);
            }
            this._setPage(pIndex, items);
            cb();
        }, this));
    };


    proto._hasPage = function(pIndex) {
        return !!this._pages[pIndex];
    };

    proto._setPage = function(pIndex, items) {
        this._pages[pIndex] = items;
    };

    proto._unsetPage = function(pIndex) {
        delete this._pages[pIndex];
    };

    proto._getPage = function(pIndex) {
        return this._pages[pIndex];
    };

    proto._getPageIndices = function() {
        return _.keys(this._pages);
    };

    proto._renderPage = function(pIndex) {
        var items = this._getPage(pIndex);
        var $pg = $('<div>').attr({
            'class': 'page',
            'p-index': pIndex
        });
        var startItemIndex = this._pageSize * pIndex;
        for (var i = 0; i < items.length; i++) {
            var itemIndex = startItemIndex + i;
            var $item = $('<div>').attr({
                'class': 'item',
                'index': itemIndex
            });
            $item.html(items[i]);
            $item.appendTo($pg);
        }
        return $pg;
    };

    proto._domRemovePage = function() {

    };

    proto._domInsertPage = function(pIndex, dom) {
        var referencePage;
        if ((referencePage = this._domPages[pIndex - 1])) {
            referencePage.after(dom);
        } else if ((referencePage = this._domPages[pIndex + 1])) {
            referencePage.before(dom);
        } else {
            this._container.append(dom);
        }
        this._domPages[pIndex] = dom;
    };

    proto._domGetItem = function(pIndex, iIndex) {
        var page = this._domPages[pIndex];
        if (!page) {
            return false;
        }
        var found = page.children()[iIndex - pIndex * this._pageSize];
        if (found) {
            return $(found);
        }
        return false;
    };

    proto._domGetItemTop = function(pIndex, iIndex) {
        var item = this._domGetItem(pIndex, iIndex);
        if (false === item) {
            return false;
        }
        return item.position().top;
    };

    proto._domScrollTo = function(pIndex, iIndex) {
        var delta = this._domGetItemTop(pIndex, iIndex);
        var currentScroll = this._container.scrollTop();
        this._container.scrollTop(currentScroll + delta);
    };

    proto._domGetCurrentItemCoordinates = function() {
        var containerPos = this._container.offset();
        var firstNode = document.elementFromPoint(containerPos.left, containerPos.top);
        firstNode = $(firstNode).closest('.item');
        if(!firstNode) {
            return false;
        }
        var index = 1 * firstNode.attr('index');
        return [index];
    };

    proto.__ = function() {};
    proto.__ = function() {};
    proto.__ = function() {};
    proto.__ = function() {};
    proto.__ = function() {};

    return PageableView;
}());