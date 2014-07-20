# jquery-clip [![spm version](http://spmjs.io/badge/jquery-clip)](http://spmjs.io/package/jquery-clip)

AUTHOR WEBSITE: [http://ydr.me/](http://ydr.me/)

jquery.fn.clip 本地图像裁剪

**五星提示：当前脚本未作优化，请勿用在生产环境**

__IT IS [A SPM PACKAGE](http://spmjs.io/package/jquery-clip).__




#usage
```
var $ = require('jquery');
require('jquery-clip')($);
```



#options
```
$.fn.clip.defaults = {
    // 固定宽度，0为任意
    width: 0,

    // 固定高度，0为任意
    height: 0,

    // 宽高比，0为任意
    // 宽高比与固定宽度互斥
    // 但宽高比的优先级更高
    aspectRatio: 0,

    // 裁剪的大小
    clipWidth: 100,
    clipHeight: 100,

    // 预览区的jquery对象
    // 预览大小与裁剪大小互斥
    // 但预览对象的尺寸优先级更高
    $preview: null,

    // 正裁剪中
    // arg0: x0
    // arg1: y0
    // arg2: x1
    // arg3: y1
    // arg4: w
    // arg5: h
    onchange: function() {},

    // 裁剪结束
    // arg0: blob
    // arg1: filename
    onclip: function() {},

    // 裁剪错误
    // arg0: event
    oncliperror: function() {}
};
```
