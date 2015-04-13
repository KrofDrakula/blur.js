(function(global) {
    
    function Blur(source, hide) {
        this.original = source;
        this.doc      = this.original.ownerDocument;
        this.blurred  = this.doc.createElement('canvas');
        this.buffer   = this.doc.createElement('canvas');
        
        this._hide = !!hide;
    }
    
    var p = Blur.prototype;

    p.init = function(ready) {
        this.original.parentNode.insertBefore(this.blurred, this.original.nextSibling);
        var eventName = this.original.nodeName == 'VIDEO' ? 'oncanplay' : 'onload';
        if (!this.original.complete) this.original[eventName] = loaded.bind(this); else loaded.call(this);
        function loaded() {
            this.blurred.style.width  = this.original.offsetWidth + 'px';
            this.blurred.style.height = this.original.offsetHeight + 'px';
            this.blurred.width  = this.buffer.width  = this.original.offsetWidth;
            this.blurred.height = this.buffer.height = this.original.offsetHeight;
            if (this._hide) this.original.style.display = 'none';
            var ctx = this.blurred.getContext('2d');
            ctx.drawImage(this.original, 0, 0, this.blurred.width, this.blurred.height);
            ready();
        }
    };

    p.gaussianBlur = function(sigma) {
        var blurCtx = this.blurred.getContext('2d'),
            bufferCtx = this.buffer.getContext('2d'),
            w = this.blurred.width,
            h = this.blurred.height,
            i,
            kernelSize = 2 * Math.ceil(sigma * 2) + 1,
            kernel = getKernel(sigma, kernelSize);
        
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(this.blurred, 0, 0);
        blurCtx.clearRect(0, 0, w, h);
        
        blurCtx.save();
        blurCtx.globalCompositeOperation = 'lighter';
        for (i = 0; i < kernel.length; i++) {
            blurCtx.globalAlpha = kernel[i];
            blurCtx.drawImage(this.buffer, i - Math.floor(kernel.length / 2), 0);
        }
        blurCtx.restore();
        
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
        ctx.drawImage(this.original, 0, 0, this.blurred.width, this.blurred.height);
    };

    function gaussianDistribution(x, sigma) {
        var n = 1 / (Math.sqrt(2 * Math.PI) * sigma);
        return Math.exp(-x * x / (2 * sigma * sigma)) * n;
    }

    function getKernel(sigma, kernelSize) {
        var kernel = [], sum = 0, x, i, g;
        for (i = 0; i < kernelSize; i++) {
            x = i - kernelSize / 2;
            sum += g = gaussianDistribution(x, sigma);
            kernel.push(g);
        }
        for (i = 0; i < kernelSize; i++)
            kernel[i] /= sum;
        return kernel;
    }
    
    global.Blur = Blur;
    
})(this);