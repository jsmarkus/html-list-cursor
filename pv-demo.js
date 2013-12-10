var list = [];

for (var t = 0; t < 1000; t++) {
    list.push('<p><b>' + t + '</b>. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>');
}


var pv = new PageableView({
    pageSize : 10,
    container: '#pv',
    read: function(from, to, cb) {
        setTimeout(function() {
            cb(null, list.slice(from, to));
        }, 100);
    }
});

pv.seek(4);