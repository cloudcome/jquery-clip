module.exports = function($){
    'use strict';
    var prefix = 'jquery-clip___',
        // hasLoadCss = 0,
        defaults = {
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


    $.fn.clip = function(settings) {
        var options = $.extend({}, defaults, settings);
        return this.each(function() {
            var clip = $(this).data(prefix);
            if (!clip) {
                $(this).data(prefix, clip = new Clip(this, options));
                clip._init();
            }else{
                clip.options = $.extend({}, clip.options, settings);
            }
        });
    };



    // 构造函数

    function Clip(element, options) {
        this.element = element;
        this.options = options;
    }


    Clip.prototype = {
        _init: function() {
            var _this = this,
                element = _this.element,
                $element = $(element),
                src = element.src,
                options = _this.options,
                image = new Image();

            // 0: 正在选区
            // 1: 正在移动
            this.status = 0;
            this.viewportWidth = 0;
            this.viewportHeight = 0;

            if ($element.parent().css('position') === 'static') $element.parent().css('position', 'relative');
            _this.$wrapper = $('<div class="' + prefix + '-wrapper"/>').insertAfter($element).css({
                position: 'absolute'
            });

            image.onload = function() {
                _this.width = $element.width();
                _this.height = $element.height();
                _this.displayWidthRatio = image.width / _this.width;
                _this.displayHeightRatio = image.height / _this.height;
                _this.$wrapper.css({
                    width: $element.width(),
                    height: $element.height(),
                    left: $element.position().left,
                    top: $element.position().top
                });
                _this.$bg = $('<div class="' + prefix + '-bg"></div>').appendTo(_this.$wrapper).hide();

                _this.$viewport = $('<div class="' + prefix + '-viewport"></div>').appendTo(_this.$wrapper).css({
                    display: 'none',
                    width: options.width,
                    height: options.height
                });

                _this.$viewportImg = $('<img src="' + src + '">').appendTo(_this.$viewport).css({
                    position: 'relative',
                    border: '0',
                    'border-radius': '0',
                    'vertical-align': 'top',
                    'max-width': 'none',
                    'max-height': 'none',
                    width: _this.width,
                    height: _this.height
                });

                if (options.$preview && options.$preview.length) {
                    options.$preview.css({
                        position: 'relative',
                        overflow: 'hidden'
                    });
                    _this.$previwImg = $('<img src="' + src + '">').appendTo(options.$preview).css({
                        position: 'absolute',
                        width: 0,
                        height: 0
                    });
                    _this.previewWidth = options.$preview.width();
                    _this.previewHeight = options.$preview.height();
                } else {
                    _this.$previwImg = $();
                    _this.previewWidth = options.clipWidth;
                    _this.previewHeight = options.clipHeight;
                }
                _this._selection();
                _this._move();
            };

            image.onerror = function(e) {
                _this.options.oncliperror(e);
            };

            image.src = $element.attr('src');
        },
        // 选区
        _selection: function() {
            var _this = this,
                options = _this.options,
                $element = $(_this.element),
                // 是否有选区了
                hasSelection = 0,
                // 是否鼠标已经按下了
                hasMousedown = 0,
                x0, y0,
                pageX0, pageY0,
                offsetLeft,
                offsetTop,
                maxWidth, maxHeight;



            _this.$wrapper.mousedown(function(e) {
                _this.status = 0;
                hasMousedown = 1;

                if (hasSelection === 1) {
                    _this.$viewport.css({
                        width: 0,
                        height: 0
                    });
                }

                offsetLeft = _this.$wrapper.offset().left,
                offsetTop = _this.$wrapper.offset().top,

                pageX0 = e.pageX;
                pageY0 = e.pageY;

                x0 = pageX0 - offsetLeft;
                y0 = pageY0 - offsetTop;

                maxWidth = _this.width - x0;
                maxHeight = _this.height - y0;

                return !1;
            });

            $(document).mousemove(function(e) {
                if (_this.status) return !1;
                if (hasMousedown !== 1) return !1;
                hasSelection = 0;
                _this.$bg.show();

                var pageX1 = e.pageX,
                    pageY1 = e.pageY,
                    width = pageX1 - pageX0,
                    height = pageY1 - pageY0,
                    widthClone,
                    heightClone,
                    // 是否参考宽度
                    isReferenceWidth,
                    // 选区比例
                    previewWidthRatio,
                    previewHeightRatio;

                if (width < 0) width = 0;
                if (height < 0) height = 0;

                widthClone = width;
                heightClone = height;

                if (options.aspectRatio && width && height) {
                    isReferenceWidth = widthClone / options.aspectRatio > heightClone / 1;
                    width = isReferenceWidth ? widthClone : heightClone * options.aspectRatio;
                    height = isReferenceWidth ? widthClone / options.aspectRatio : heightClone;
                }

                // 约束 width
                if (width > maxWidth) {
                    width = maxWidth;
                    height = options.aspectRatio ? width / options.aspectRatio : height;
                }

                // 约束 height
                if (height > maxHeight) {
                    width = options.aspectRatio ? height * options.aspectRatio : width;
                    height = maxHeight;
                }

                _this._change(x0, y0);

                _this.viewportWidth = width;
                _this.viewportHeight = height;

                return !1;
            }).mouseup(function() {
                if (_this.status || !hasMousedown) return !1;
                hasMousedown = 0;

                if (hasSelection === 1) {
                    hasSelection = 0;
                    _this.$bg.hide();
                    _this.$viewport.hide();
                } else {
                    hasSelection = 1;
                    _this._clip(x0, y0);
                }

                return !1;
            });
        },
        // 移动
        _move: function() {
            var _this = this,
                hasMousedown = 0,
                mouseOffsetLeft, mouseOffsetTop,
                wrapperOffset,
                x0, y0,
                pageX0, pageY0;

            _this.$viewport.mousedown(function(e) {
                _this.status = 1;

                hasMousedown = 1;
                pageX0 = e.pageX;
                pageY0 = e.pageY;

                mouseOffsetLeft = pageX0 - _this.$viewport.offset().left;
                mouseOffsetTop = pageY0 - _this.$viewport.offset().top;
                wrapperOffset = _this.$wrapper.offset();
                return !1;
            });

            $(document).mousemove(function(e) {
                if (!_this.status || !hasMousedown) return !1;

                x0 = e.pageX - mouseOffsetLeft - wrapperOffset.left;
                y0 = e.pageY - mouseOffsetTop - wrapperOffset.top;

                var maxLeft = _this.width - _this.viewportWidth,
                    maxTop = _this.height - _this.viewportHeight;

                if (x0 < 0) x0 = 0;
                if (x0 > maxLeft) x0 = maxLeft;
                if (y0 < 0) y0 = 0;
                if (y0 > maxTop) y0 = maxTop;

                _this._change(x0, y0);
            }).mouseup(function() {
                if (!_this.status || !hasMousedown) return !1;
                hasMousedown = 0;
                _this._clip(x0, y0);
            });
        },
        // 改变选区
        _change: function(x0, y0) {

            var _this = this,
                previewWidthRatio,
                previewHeightRatio, x1, y1;

            _this.$viewport.css({
                display: 'block',
                width: _this.viewportWidth,
                height: _this.viewportHeight,
                left: x0,
                top: y0
            });

            _this.$viewportImg.css({
                left: -x0,
                top: -y0
            });


            previewWidthRatio = _this.previewWidth / _this.viewportWidth;
            previewHeightRatio = _this.previewHeight / _this.viewportHeight;
            _this.$previwImg.css({
                width: _this.width * previewWidthRatio,
                height: _this.height * previewHeightRatio,
                left: -x0 * previewWidthRatio,
                top: -y0 * previewHeightRatio
            });

            x0 = x0 * _this.displayWidthRatio;
            x1 = x0 + _this.viewportWidth * _this.displayWidthRatio;
            y0 = y0 * _this.displayHeightRatio;
            y1 = y0 + _this.viewportHeight * _this.displayHeightRatio;
            _this.options.onchange.call(_this.element, x0, y0, x1, y1, _this.previewWidth, _this.previewHeight);
        },
        // 裁剪
        // http://stackoverflow.com/questions/2390232/why-does-canvas-todataurl-throw-a-security-exception
        _clip: function(x0, y0) {
            var _this = this,
                image = _this.element,
                canvas,
                context,
                dataURL,
                width,height;

            x0 = x0 * _this.displayWidthRatio;
            y0 = y0 * _this.displayHeightRatio;
            width = _this.viewportWidth * _this.displayWidthRatio;
            height = _this.viewportHeight * _this.displayHeightRatio;

            canvas = $('<canvas></canvas>').appendTo('body').attr({
                width: _this.previewWidth || width,
                height: _this.previewHeight || height
            })[0];
            context = canvas.getContext && canvas.getContext('2d');


            try {
                // 清除画布
                // context.clearRect(0, 0, _this.width, _this.height);

                // 载入图像
                // sx,sy,swidth,sheight,x,y,width,height
                // 源坐标x
                // 源坐标y
                // 源宽度
                // 源高度
                // 画布坐标x
                // 画布坐标y
                // 画像宽度
                // 画像高度
                context.drawImage(image, x0, y0, width, height, 0, 0, _this.previewWidth || width, _this.previewHeight||height);

                // 转为 dataURL
                // http://forums.asp.net/t/1806521.aspx?How+to+convert+image+file+into+binary+file+using+javascript+
                dataURL = canvas.toDataURL();

                // http://stackoverflow.com/a/9066159
                _this.options.onclip.call(_this.element, _this._dataURL2Blob(dataURL), prefix + '.png');

                $(canvas).remove();
            } catch (e) {
                _this.options.oncliperror.call(_this.element, e);
                $(canvas).remove();
            }
        },
        // dataURL 转换为 blob
        // http://stackoverflow.com/q/18253378
        _dataURL2Blob: function(dataURL) {
            var byteString = atob(dataURL.split(',')[1]),
                mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0],
                ab = new ArrayBuffer(byteString.length),
                ia = new Uint8Array(ab),
                i = 0;

            for (; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            return new Blob([ab], {
                "type": mimeString
            });
        }
    };
};
