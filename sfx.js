(function(global) {
    function SFX(source) {
        this.source = source;
        this.canvas = null;
    }
    
    Object.defineProperties(SFX.prototype, {
        doc: { get: function() { return this.source.ownerDocument; } },
        win: { get: function() { return this.doc.defaultView; } }
    });
    
    SFX.prototype.init = function(cb) {
        done = done.bind(this);
        this.canvas = this.doc.createElement('canvas');
        if (this.source.complete) this.win.setTimeout(done, 0);
        else this.source.addEventListener('load', function loadHandler() {
            this.source.removeEventListener('load', loadHandler);
            done();
        }.bind(this));
        function done() {
            this._setCanvasSize(this.source.naturalWidth, this.source.naturalHeight);
            this.restore();
            cb(this.canvas);
        }
    };
    
    SFX.prototype._setCanvasSize = function(w, h) {
        this.width  = this.canvas.width  = w;
        this.height = this.canvas.height = h;
    };
    
    SFX.prototype._copy = function(canvas) {
        var c = this.doc.createElement('canvas'),
            ctx = c.getContext('2d');
        c.width = canvas.width;
        c.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
        return c;
    };
    
    SFX.prototype.redraw = function() {
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(this.source, 0, 0);
        return this;
    };
    
    SFX.prototype.restore = function(amount) {
        amount = typeof amount == 'undefined' ? 1 : amount;
        if (amount == 0) return this;
        var ctx = this.canvas.getContext('2d');
        ctx.save();
        ctx.globalAlpha = amount;
        ctx.drawImage(this.source, 0, 0);
        ctx.restore();
    };
    
    // -----[ Gamma ]-----
    SFX.prototype.gamma = function(gamma) {
        if (gamma == 1) return this;
        gamma = clamp(0.5, 2, gamma);
        var canvasCtx = this.canvas.getContext('2d');
        canvasCtx.save();
        if (gamma > 1) {
            canvasCtx.globalCompositeOperation = 'multiply';
            canvasCtx.globalAlpha = gamma - 1;
        } else {
            canvasCtx.globalCompositeOperation = 'screen';
            canvasCtx.globalAlpha = 1 - (gamma - 0.5) / 0.5;
        }
        canvasCtx.drawImage(this.canvas, 0, 0);
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Tint ]-----
    SFX.prototype.tint = function(color, amount) {
        if (amount == 0) return this;
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save();
        canvasCtx.globalAlpha = clamp(0, 1, amount);
        canvasCtx.globalCompositeOperation = 'hue';
        canvasCtx.fillStyle = color;
        canvasCtx.fillRect(0, 0, this.width, this.height);
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Overlay ]-----
    SFX.prototype.overlay = function(color, amount) {
        if (amount == 0) return this;
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save();
        canvasCtx.globalAlpha = clamp(0, 1, amount);
        canvasCtx.globalCompositeOperation = 'multiply';
        canvasCtx.fillStyle = color;
        canvasCtx.fillRect(0, 0, this.width, this.height);
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Brightness ]-----
    SFX.prototype.brightness = function(amount) {
        if (amount == 0) return this;
        amount = clamp(-1, 1, amount);
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save();
        canvasCtx.globalAlpha = Math.abs(amount);
        canvasCtx.globalCompositeOperation = amount < 0 ? 'darken' : 'lighten';
        canvasCtx.fillStyle = amount < 0 ? 'black' : 'white';
        canvasCtx.fillRect(0, 0, this.width, this.height);
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Contrast ]-----
    SFX.prototype.contrast = function(amount) {
        if (amount == 0) return this;
        amount = clamp(-1, 1, amount);
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save();
        canvasCtx.globalAlpha = Math.abs(amount);
        if (amount > 0) {
            canvasCtx.globalCompositeOperation = 'overlay';
            canvasCtx.drawImage(this.canvas, 0, 0);
        } else {
            canvasCtx.globalCompositeOperation = 'multiply';
            canvasCtx.fillStyle = '#777777';
            canvasCtx.fillRect(0, 0, this.width, this.height);
            canvasCtx.globalCompositeOperation = 'screen';
            canvasCtx.drawImage(this.canvas, 0, 0);
        }
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Saturation ]-----
    SFX.prototype.saturation = function(amount) {
        if (amount == 0) return this;
        amount = clamp(-1, 1, amount);
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save();
        canvasCtx.globalAlpha = amount < 0 ? -amount : amount / 4;
        canvasCtx.globalCompositeOperation = 'saturation';
        canvasCtx.fillStyle = amount < 0 ? 'black' : 'red';
        canvasCtx.fillRect(0, 0, this.width, this.height);
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Grain ]-----
    SFX.prototype.grain = function(amount) {
        if (amount == 0) return this;
        var canvasCtx = this.canvas.getContext('2d'),
            b = this._copy(this.canvas),
            bCtx = b.getContext('2d'),
            imgData = bCtx.getImageData(0, 0, this.width, this.height),
            arr = imgData.data;
        
        for (var i = 0; i < arr.length; i += 4) {
            var l = (Math.random() * 255) | 0;
            arr[i] = l;
            arr[i+1] = l;
            arr[i+2] = l;
            arr[i+3] = 255;
        }
        
        bCtx.putImageData(imgData, 0, 0);
        
        canvasCtx.save();
        canvasCtx.globalAlpha = amount;
        canvasCtx.globalCompositeOperation = 'overlay';
        canvasCtx.drawImage(b, 0, 0);
        canvasCtx.restore();
            
    };
    
    // -----[ Chromatic aberration ]-----
    SFX.prototype.chromatic = function(distance) {
        if (distance == 0) return this;
        var canvasCtx = this.canvas.getContext('2d'),
            b1 = this._copy(this.canvas),
            b2 = this._copy(this.canvas),
            b1Ctx = b1.getContext('2d'),
            b2Ctx = b2.getContext('2d'),
            r = this.height / this.width;
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, this.width, this.height);
        canvasCtx.globalCompositeOperation = 'lighten';
        
        // null out everything but the blue channel
        b1Ctx.globalCompositeOperation = 'multiply';
        b1Ctx.fillStyle = '#0000ff';
        b1Ctx.fillRect(0, 0, this.width, this.height);
        
        canvasCtx.drawImage(b1, 0, 0);
        
        // add green channel with distance/2 offset
        b1Ctx.globalCompositeOperation = 'source-over';
        b1Ctx.clearRect(0, 0, this.width, this.height);
        b1Ctx.fillStyle = '#00ff00';
        b1Ctx.fillRect(0, 0, this.width, this.height);
        b1Ctx.globalCompositeOperation = 'multiply';
        b1Ctx.drawImage(b2, -distance/2, -distance/2 * r, this.width + distance, this.height + distance * r);
        
        canvasCtx.drawImage(b1, 0, 0);
        
        // finally add the red channel
        b1Ctx.globalCompositeOperation = 'source-over';
        b1Ctx.clearRect(0, 0, this.width, this.height);
        b1Ctx.fillStyle = '#ff0000';
        b1Ctx.fillRect(0, 0, this.width, this.height);
        b1Ctx.globalCompositeOperation = 'multiply';
        b1Ctx.drawImage(b2, -distance, -distance * r, this.width + distance * 2, this.height + distance * 2 * r);
        
        canvasCtx.drawImage(b1, 0, 0);
        
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Invert ]------
    SFX.prototype.invert = function() {
        var canvasCtx = this.canvas.getContext('2d');
        
        canvasCtx.save(),
        canvasCtx.globalCompositeOperation = 'difference';
        canvasCtx.fillStyle = 'white';
        canvasCtx.fillRect(0, 0, this.width, this.height),
        canvasCtx.restore();
        
        return this;
    };
    
    // -----[ Blur ]-----
    SFX.prototype.blur = function(sigma) {
        if (sigma == 0) return this;
        var canvasCtx = this.canvas.getContext('2d'),
            buffer    = this.doc.createElement('canvas'),
            bufferCtx = buffer.getContext('2d'),
            w = this.width,
            h = this.height,
            i,
            kernelSize = 2 * Math.ceil(sigma * 2) + 1,
            kernel = getKernel(sigma, kernelSize);
        
        buffer.width  = w;
        buffer.height = h;
        
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(this.canvas, 0, 0, w, h);
        canvasCtx.clearRect(0, 0, w, h);
        
        canvasCtx.save();
        canvasCtx.globalCompositeOperation = 'lighter';
        for (i = 0; i < kernel.length; i++) {
            canvasCtx.globalAlpha = kernel[i];
            canvasCtx.drawImage(buffer, i - Math.floor(kernel.length / 2), 0);
        }
        canvasCtx.restore();
        
        bufferCtx.clearRect(0, 0, w, h);
        bufferCtx.drawImage(this.canvas, 0, 0, w, h);
        canvasCtx.clearRect(0, 0, w, h);
        
        canvasCtx.save();
        canvasCtx.globalCompositeOperation = 'lighter';
        for (i = 0; i < kernel.length; i++) {
            canvasCtx.globalAlpha = kernel[i];
            canvasCtx.drawImage(buffer, 0, i - Math.floor(kernel.length / 2));
        }
        canvasCtx.restore();
        
        return this;
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
    
    function clamp(a, b, x) {
        return Math.max(a, Math.min(b, x));
    }
    
    global.SFX = SFX;
})(this);