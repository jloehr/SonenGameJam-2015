var Game = {
    Canvas: null,
    Context: null,
    FixedTimestep: 30,
    GrowMap: null,
    Background: null,
    FrameCounter: 0,

    Init: function()
    {
        this.SetupCanvas();
        this.GrowMap = new GrowMap(this.Canvas, this.Context);

        window.setInterval(function () { Game.Tick(); }, this.FixedTimestep);
    },

    SetupCanvas : function()
    {
        this.Canvas = document.getElementById("GameScreen");
        this.Canvas.width = window.innerWidth;
        this.Canvas.height = window.innerHeight;
        this.Context = this.Canvas.getContext("2d");

        this.Background = this.Context.createImageData(this.Canvas.width, this.Canvas.height);
        for (var i = 0; i < this.Background.data.length; i += 4) {
            this.Background.data[i + 0] = 139;
            this.Background.data[i + 1] = 69;
            this.Background.data[i + 2] = 19;
            this.Background.data[i + 3] = 255;
        }
        this.Context.putImageData(this.Background, 0, 0);
    },

    Tick : function()
    {
        this.FrameCounter++;
        console.log("Frame: " + this.FrameCounter);
        this.Update();
        this.Draw();
    },

    Update : function()
    {
        this.GrowMap.Update();
    },

    Draw : function()
    {
        this.GrowMap.Draw(this.Background);
    }
}

function GrowMap(Canvas, Context)
{
    this.Canvas = Canvas;
    this.Context = Context;

    this.ImageData = null;
    this.Growth = null;
    this.DirtyPixels = [];

    this.Constructor = function()
    {
        this.ImageData = this.Context.createImageData(Canvas.width, Canvas.height);
        this.Growth = new Float32Array(Canvas.width * Canvas.height);
        for (var i = 0; i < this.ImageData.data.length; i += 4)
        {
            this.ImageData.data[i + 0] = 0;
            this.ImageData.data[i + 1] = 255;
            this.ImageData.data[i + 2] = 0;
            this.ImageData.data[i + 3] = 255;
        }

        var X = Canvas.width / 2;
        var Y = Canvas.height / 2;
        var i = this.ToGrowthIndex(X, Y);
        this.Growth[i] = 0;
        this.DirtyPixels.push({ X : X, Y : Y });
    }

    this.Draw = function(Background)
    {
        for (var i = 0; i < this.DirtyPixels.length; i++)
        {
            var Element = this.DirtyPixels[i];
            var PixelData = this.Context.getImageData(Element.X, Element.Y, 1, 1);

            var GrowthIndex = this.ToGrowthIndex(Element.X, Element.Y);
            var PixelIndex = this.ToPixelIndex(Element.X, Element.Y);
            var Blend = this.Growth[GrowthIndex];
            PixelData.data[0] = Background.data[PixelIndex + 0] * (1 - Blend) + this.ImageData.data[PixelIndex + 0] * Blend;
            PixelData.data[1] = Background.data[PixelIndex + 1] * (1 - Blend) + this.ImageData.data[PixelIndex + 1] * Blend;
            PixelData.data[2] = Background.data[PixelIndex + 2] * (1 - Blend) + this.ImageData.data[PixelIndex + 2] * Blend;

            this.Context.putImageData(PixelData, Element.X, Element.Y);
        }
    }

    this.Update = function()
    {   
        for (var i = this.DirtyPixels.length - 1; i >= 0; i--)
        {
            var Element = this.DirtyPixels[i];
            this.Regrow(i, Element.X, Element.Y);
        }
    }

    this.Regrow = function(DirtyIndex, X, Y)
    {
        var i = this.ToGrowthIndex(X, Y);
        if(this.Growth[i] >= 1)
        {
            this.Growth[i] = 1;
            this.DirtyPixels.splice(DirtyIndex, 1);
            return;
        }

        this.Growth[i] += 0.05;
    }

    this.ToGrowthIndex = function(X, Y)
    {
        return Y * this.Canvas.width + X;
    }

    this.ToPixelIndex = function (X, Y) {
        return (Y * 4) * this.Canvas.width + (X * 4);
    }

    this.Constructor();
}