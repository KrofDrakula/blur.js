(function(global) {
    
    function Blur(source, options) {
        this.source  = source;
        this.blurred = document.createElement('canvas');
        this.buffer  = document.createElement('canvas');
        
        options = options || {};
        
        this.options = {
            width      : options.width  || null,
            height     : options.height || null,
            resolution : options.resolution || 'native'
        };
    }
    
    var p = Blur.prototype;

    p.init = function(ready) {
        this.source.parentNode.insertBefore(this.blurred, this.source.nextSibling);
        var eventName = this.source.nodeName == 'VIDEO' ? 'oncanplay' : 'onload';
        if (!this.source.complete) this.source[eventName] = loaded.bind(this); else setTimeout(loaded.bind(this), 0);
        function loaded() {
            this.blurred.style.width  = this.source.offsetWidth + 'px';
            this.blurred.style.height = this.source.offsetHeight + 'px';
            if (this.options.resolution == 'native') {
                this.blurred.width  = this.buffer.width  = this.source.videoWidth  || this.source.naturalWidth;
                this.blurred.height = this.buffer.height = this.source.videoHeight || this.source.naturalHeight;    
            } else {
                this.blurred.width  = this.buffer.width  = this.options.width  || this.source.offsetWidth;
                this.blurred.height = this.buffer.height = this.options.height || this.source.offsetHeight;
            }
            var ctx = this.blurred.getContext('2d');
            ctx.drawImage(this.source, 0, 0, this.blurred.width, this.blurred.height);
            ready();
        }
    };

    p.blur = function(sigma) {
        var blurCtx = this.blurred.getContext('2d'),
            bufferCtx = this.buffer.getContext('2d'),
            w = this.blurred.width,
            h = this.blurred.height,
            i,
            kernelSize = 2 * Math.ceil(sigma * 2) + 1,
            kernel = getKernel(sigma, kernelSize);
        
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(this.source, 0, 0, w, h);
        blurCtx.clearRect(0, 0, w, h);
        
        blurCtx.save();
        blurCtx.globalCompositeOperation = 'lighter';
        for (i = 0; i < kernel.length; i++) {
            blurCtx.globalAlpha = kernel[i];
            blurCtx.drawImage(this.buffer, i - Math.floor(kernel.length / 2), 0);
        }
        blurCtx.restore();
        
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(this.blurred, 0, 0, w, h);
        blurCtx.clearRect(0, 0, w, h);
        
        blurCtx.save();
        blurCtx.globalCompositeOperation = 'lighter';
        for (i = 0; i < kernel.length; i++) {
            blurCtx.globalAlpha = kernel[i];
            blurCtx.drawImage(this.buffer, 0, i - Math.floor(kernel.length / 2));
        }
        blurCtx.restore();
    };

    p.restore = function() {
        var ctx = this.blurred.getContext('2d');
        ctx.drawImage(this.source, 0, 0, this.blurred.width, this.blurred.height);
    };

    function nDist(x, sigma) {
        var n = 1 / (Math.sqrt(2 * Math.PI) * sigma);
        return Math.exp(-x * x / (2 * sigma * sigma)) * n;
    }
    
    function simpson(a, b, sigma) {
        return (b - a) / 6 * (nDist(a, sigma) + 4 * nDist((a + b) / 2, sigma) + nDist(b, sigma));
    }

    function getKernel(sigma, kernelSize) {
        var kernel = [], sum = 0, x, i, j, v;
        for (i = 0; i < kernelSize; i++) {
            x = i - kernelSize / 2;
            sum += v = simpson(x - 0.5, x + 0.5, sigma);
            kernel.push(v);
        }
        for (i = 0; i < kernelSize; i++)
            kernel[i] /= sum;
        return kernel;
    }
    
    global.Blur = Blur;
    
})(this);