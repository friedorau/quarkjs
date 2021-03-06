
(function(){

/**
 * Constructor.
 * @name Graphics
 * @augments DisplayObject
 * @class The Graphics class contains a set of methods that you can use to create a vector shape.
 */ 
var Graphics = Quark.Graphics = function(props)
{
	props = props || {};
	Graphics.superClass.constructor.call(this, props);
	this.id = Quark.UIDUtil.createUID("Graphics");
	
	this.lineWidth = 1;
	this.strokeStyle = "0";
	this.lineAlpha = 1;
	this.lineCap = null; //"butt", "round", "square"
	this.lineJoin = null; //"miter", "round", "bevel"
	this.miterLimit = 10;
	
	this.fillStyle = "0";
	this.fillAlpha = 1;
	
	this._actions = [];
	this._cache = null;
};
Quark.inherit(Graphics, Quark.DisplayObject);

/**
 * Specifies a line style that Canvas uses for subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) for the object.
 */
Graphics.prototype.lineStyle = function(thickness, lineColor, alpha, lineCap, lineJoin, miterLimit)
{	
	this._addAction(["lineWidth", (this.lineWidth = thickness || 1)]);
	this._addAction(["strokeStyle", (this.strokeStyle = lineColor || "0")]);
	this._addAction(["lineAlpha", (this.lineAlpha = alpha || 1)]);
	if(lineCap != undefined) this._addAction(["lineCap", (this.lineCap = lineCap)]);
	if(lineJoin != undefined) this._addAction(["lineJoin", (this.lineJoin = lineJoin)]);
	if(miterLimit != undefined) this._addAction(["miterLimit", (this.miterLimit = miterLimit)]);
	return this;
};

/**
 * Specifies an available fill that subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) use when drawing.
 */
Graphics.prototype.beginFill = function(fill, alpha)
{
	this._addAction(["fillStyle", (this.fillStyle = fill)]);
	this._addAction(["fillAlpha", (this.fillAlpha = alpha || 1)]);
	return this;
};

/**
 * Applies a fill to the lines and curves that were added.
 */
Graphics.prototype.endFill = function()
{
	this._addAction(["stroke"]);
	this._addAction(["fill"]);
	return this;
};

/**
 * Specifies a linear gradient fill that subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) use when drawing.
 */
Graphics.prototype.beginLinearGradientFill = function(x0, y0, x1, y1, colors, ratios)
{
	var gradient = Graphics._getContext().createLinearGradient(x0, y0, x1, y1);
	for (var i = 0, len = colors.length; i < len; i++)
	{
		gradient.addColorStop(ratios[i], colors[i]);
	}
	return this._addAction(["fillStyle", (this.fillStyle = gradient)]);
};

/**
 * Specifies a radial gradient fill that subsequent calls to other Graphics methods (such as lineTo() or drawCircle()) use when drawing.
 */
Graphics.prototype.beginRadialGradientFill = function(x0, y0, r0, x1, y1, r1, colors, ratios)
{
	var gradient = Graphics._getContext().createRadialGradient(x0, y0, r0, x1, y1, r1);
	for (var i = 0, len = colors.length; i < len; i++)
	{
		gradient.addColorStop(ratios[i], colors[i]);
	}	
	return this._addAction(["fillStyle", (this.fillStyle = gradient)]);
};

/**
 * Fills a drawing area with a bitmap image. 
 * The repetition parameter must be one of the following values: repeat, repeat-x, repeat-y, no-repeat.
 */
Graphics.prototype.beginBitmapFill = function(image, repetition)
{
	var pattern = Graphics._getContext().createPattern(image, repetition || "");
	return this._addAction(["fillStyle", (this.fillStyle = pattern)]);
};

/**
 * Begins a path.
 */
Graphics.prototype.beginPath = function()
{
	return this._addAction(["beginPath"]);
};

/**
 * Closes a path.
 */
Graphics.prototype.closePath = function()
{
	return this._addAction(["closePath"]);
};

/**
 * Draws a rectangle.
 */
Graphics.prototype.drawRect = function(x, y, width, height)
{
	return this._addAction(["rect", x, y, width, height]);
};

/**
 * Draws a complex rounded rectangle.
 */
Graphics.prototype.drawRoundRectComplex = function(x, y, width, height, cornerTL, cornerTR, cornerBR, cornerBL)
{
	this._addAction(["moveTo", x + cornerTL, y]);
	this._addAction(["lineTo", x + width - cornerTR, y]);
	this._addAction(["arc", x + width - cornerTR, y + cornerTR, cornerTR, -Math.PI/2, 0, false]);
	this._addAction(["lineTo", x + width, y + height - cornerBR]);
	this._addAction(["arc", x + width - cornerBR, y + height - cornerBR, cornerBR, 0, Math.PI/2, false]);
	this._addAction(["lineTo", x + cornerBL, y + height]);
	this._addAction(["arc", x + cornerBL, y + height - cornerBL, cornerBL, Math.PI/2, Math.PI, false]);
	this._addAction(["lineTo", x, y + cornerTL]);
	this._addAction(["arc", x + cornerTL, y + cornerTL, cornerTL, Math.PI, Math.PI*3/2, false]);
	return this;
};

/**
 * Draws a rounded rectangle.
 */
Graphics.prototype.drawRoundRect = function(x, y, width, height, cornerSize)
{
	return this.drawRoundRectComplex(x, y, width, height, cornerSize, cornerSize, cornerSize, cornerSize);
};

/**
 * Draws a circle.
 */
Graphics.prototype.drawCircle = function(x, y, radius)
{
	return this._addAction(["arc", x + radius, y + radius, radius, 0, Math.PI * 2, 0]);
};

/**
 * Draws a ellipse.
 */
Graphics.prototype.drawEllipse = function(x, y, width, height)
{
	if(width == height) return this.drawCircle(x, y, width);
	
	var w = width / 2, h = height / 2, C = 0.5522847498307933, cx = C * w, cy = C * h;
	x = x + w;
	y = y + h;
	
	this._addAction(["moveTo", x + w, y]);
	this._addAction(["bezierCurveTo", x + w, y - cy, x + cx, y - h, x, y - h]);
	this._addAction(["bezierCurveTo", x - cx, y - h, x - w, y - cy, x - w, y]);
	this._addAction(["bezierCurveTo", x - w, y + cy, x - cx, y + h, x, y + h]);
	this._addAction(["bezierCurveTo", x + cx, y + h, x + w, y + cy, x + w, y]);
	return this;
};

/**
 * Override method.
 * @private
 */
Graphics.prototype.render = function(context)
{
	var ctx = context.context;
	if(ctx == null)
	{
		Graphics.superClass.render.call(this, context);
	}else
	{
		if(this._cache != null)
		{
			ctx.drawImage(this._cache, 0, 0);
		}else
		{
			this._draw(ctx);
		}
	}
};

/**
 * Performs all drawing actions. For internal use.
 * @private
 */
Graphics.prototype._draw = function(context)
{	
	for(var i = 0, len = this._actions.length; i < len; i++)
	{
		var action = this._actions[i], 
			f = action[0], 
			args = action.length > 1 ? action.slice(1) : null;
		
		if(typeof(context[f]) == "function") context[f].apply(context, args);
		else context[f] = action[1];
	}
};

/**
 * Override method.
 * @private
 */
Graphics.prototype.getDrawable = function(context)
{
	//for DOMContext drawing only
	if(this.drawable == null) this.setDrawable(this.toImage());
	return this.drawable.get(this, context);
};

/**
 * Caches the graphics to a canvas or image. Increase the performance normally.
 */
Graphics.prototype.cache = function(toImage)
{
	var canvas = Quark.createDOM("canvas", {width:this.width, height:this.height});
	this._draw(canvas.getContext("2d"));
	
	this._cache = canvas;
	if(toImage) this._cache = this.toImage();
	return this._cache;
};

/**
 * Releases the cache.
 */
Graphics.prototype.uncache = function()
{
	this._cache = null;
};

/**
 * Converts the graphics to a dataURL image.
 */
Graphics.prototype.toImage = function(type)
{
	var cache = this._cache || this.cache(true);
	if(cache instanceof HTMLImageElement) return cache;
	
	var img = new Image();
	img.src = cache.toDataURL(type || "image/png");
	img.width = this.width;
	img.height = this.height;
	return img;
};

/**
 * Clears all drawing actions and cached image.
 */
Graphics.prototype.clear = function()
{
	this._actions.length = 0;
	this._cache = 0;
	
	this.lineWidth = 1;
	this.strokeStyle = "0";
	this.lineAlpha = 1;
	this.lineCap = null;
	this.lineJoin = null;
	this.miterLimit = 10;
	
	this.fillStyle = "0";
	this.fillAlpha = 1;
};

/** 
 * Adds a drawing action. For internal use.
 * @private
 */
Graphics.prototype._addAction = function(action)
{
	this._actions.push(action);
	return this;
};

/**
 * @private
 */
Graphics._getContext = function()
{
	var ctx = Quark.createDOM("canvas").getContext("2d");
	this._getContext = function()
	{
		return ctx;
	};
	return ctx;
};
	
})();