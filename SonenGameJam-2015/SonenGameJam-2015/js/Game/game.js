var Game = {
    Canvas: null,
    Context: null,
    FixedTimestep: 30,
    GrowMap: null,
    Background: null,

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

    },

    Tick : function()
    {
        this.Update();
        this.Draw();
    },

    Update : function()
    {

    },

    Draw : function()
    {
        this.Context.putImageData(this.Background, 0, 0);
        this.GrowMap.Draw();
    }
}

function GrowMap(Canvas, Context)
{
    this.Canvas = Canvas;
    this.Context = Context;

    this.ImageData = null;

    this.Constructor = function()
    {
        this.ImageData = this.Context.createImageData(Canvas.width, Canvas.height);
        for (var i = 0; i < this.ImageData.data.length; i += 4)
        {
            this.ImageData.data[i + 0] = 0;
            this.ImageData.data[i + 1] = 255;
            this.ImageData.data[i + 2] = 0;
            this.ImageData.data[i + 3] = 255;
        }
    }

    this.Draw = function()
    {
        var CanvasData = this.Context.getImageData(0, 0, this.Canvas.width, this.Canvas.height);
        for (var i = 0; i < CanvasData.data.length; i += 4)
        {
            var Blend = (this.ImageData.data[i + 3] / 255);
            CanvasData.data[i + 0] = CanvasData.data[i + 0] * (1 - Blend) + this.ImageData.data[i + 0] * Blend;
            CanvasData.data[i + 1] = CanvasData.data[i + 1] * (1 - Blend) + this.ImageData.data[i + 1] * Blend;
            CanvasData.data[i + 2] = CanvasData.data[i + 2] * (1 - Blend) + this.ImageData.data[i + 2] * Blend;
        }

        this.Context.putImageData(CanvasData, 0, 0);
    }

    this.Constructor();
}