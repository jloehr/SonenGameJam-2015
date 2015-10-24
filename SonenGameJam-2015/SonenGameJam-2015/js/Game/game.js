var Game = {
    Canvas: null,
    Context: null,
    FixedTimestep: 30,
    GameLoop : null,
    GrowMap: null,
    Background: null,
    FrameCounter: 0,

    Init: function()
    {
        this.SetupCanvas();
        this.GrowMap = new GrowMap(this.Canvas, this.Context);
        
        this.Canvas.addEventListener("pointerdown", function (event) { Game.OnPointerDown(event) });

        this.Draw();

        this.GameLoop = window.setInterval(function () { Game.Tick(); }, this.FixedTimestep);
        //window.setTimeout(function () { Game.Finit(); }, 15000);
    },

    Finit : function()
    {
        clearInterval(this.GameLoop);
        this.GameLoop = null;
        console.log("End!");
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
    },

    OnPointerDown : function(event)
    {
        console.log("Pointer at " + event.clientX + ", " + event.clientY);
        this.GrowMap.ClearArea(event.clientX, event.clientY);
    }
}

function GrowMap(Canvas, Context)
{
    this.Canvas = Canvas;
    this.Context = Context;

    this.ImageData = null;
    this.DrawBuffer = null;
    this.Growth = null;
    this.DirtyPixels = [];

    this.SelfGrowth = 1.01;
    this.DirectNeighborGrowth = 0.01;
    this.DiagonalNeighborGrowth = 0.005;

    this.ClearRadius = 15;
    this.ClearSmooth = 5;
    this.ClearStencil = null;

    this.Constructor = function()
    {
        this.ImageData = this.Context.createImageData(Canvas.width, Canvas.height);
        this.Buffer = this.Context.createImageData(1, 1);
        this.Growth = new Float32Array(Canvas.width * Canvas.height);
        this.ClearStencil = new Float32Array(2 * this.ClearRadius * 2 * this.ClearRadius);

        for (var i = 0; i < this.ImageData.data.length; i += 4)
        {
            this.ImageData.data[i + 0] = 0;
            this.ImageData.data[i + 1] = 255;
            this.ImageData.data[i + 2] = 0;
            this.ImageData.data[i + 3] = 255;
        }

        this.Buffer.data[3] = 255;

        this.Growth.fill(1);

        for(var y = 0; y < 2 * this.ClearRadius; y++)
            for(var x = 0; x < 2 * this.ClearRadius; x++)
            {
                var StencilIndex = y * 2 * this.ClearRadius + x;

                var Distance = Math.sqrt(Math.pow(x - this.ClearRadius, 2) + Math.pow(y - this.ClearRadius, 2));
                if (Distance > (this.ClearRadius - this.ClearSmooth))
                {
                    Distance -= this.ClearRadius - this.ClearSmooth;
                    this.ClearStencil[StencilIndex] = Math.min(1, Distance / this.ClearSmooth);

                }
                else
                {
                    this.ClearStencil[StencilIndex] = 0;
                }
            }

        var X = Canvas.width / 2;
        var Y = Canvas.height / 2;
        this.ClearArea(X, Y);

        this.Context.putImageData(this.ImageData, 0, 0); 
    }

    this.Draw = function(Background)
    {
        for (var i = 0; i < this.DirtyPixels.length; i++)
        {
            var Element = this.DirtyPixels[i];

            var GrowthIndex = this.ToGrowthIndex(Element.X, Element.Y);
            var PixelIndex = this.ToPixelIndex(Element.X, Element.Y);
            var Blend = Math.min(1, this.Growth[GrowthIndex]);
            this.Buffer.data[0] = Background.data[PixelIndex + 0] * (1 - Blend) + this.ImageData.data[PixelIndex + 0] * Blend;
            this.Buffer.data[1] = Background.data[PixelIndex + 1] * (1 - Blend) + this.ImageData.data[PixelIndex + 1] * Blend;
            this.Buffer.data[2] = Background.data[PixelIndex + 2] * (1 - Blend) + this.ImageData.data[PixelIndex + 2] * Blend;

            this.Context.putImageData(this.Buffer, Element.X, Element.Y);
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

        var NewGrowth = this.Growth[i] * 1.01;
        NewGrowth += this.GetNeighborGrowth(X + 0, Y - 1, false);
        NewGrowth += this.GetNeighborGrowth(X + 1, Y - 1, true);
        NewGrowth += this.GetNeighborGrowth(X + 1, Y - 0, false);
        NewGrowth += this.GetNeighborGrowth(X + 1, Y + 1, true);
        NewGrowth += this.GetNeighborGrowth(X + 0, Y + 1, false);
        NewGrowth += this.GetNeighborGrowth(X - 1, Y + 1, true);
        NewGrowth += this.GetNeighborGrowth(X - 1, Y + 0, false);
        NewGrowth += this.GetNeighborGrowth(X - 1, Y - 1, true);

        this.Growth[i] = NewGrowth;

        if (NewGrowth > 0.25)
        {
            this.SeedNeighbor(X + 0, Y - 1);
            this.SeedNeighbor(X + 1, Y - 1);
            this.SeedNeighbor(X + 1, Y - 0);
            this.SeedNeighbor(X + 1, Y + 1);
            this.SeedNeighbor(X + 0, Y + 1);
            this.SeedNeighbor(X - 1, Y + 1);
            this.SeedNeighbor(X - 1, Y + 0);
            this.SeedNeighbor(X - 1, Y - 1);
        }

        if(NewGrowth == 0)
        {
            this.DirtyPixels.splice(DirtyIndex, 1);
        }
    }

    this.GetNeighborGrowth = function(X, Y, Diagonal)
    {
        var i = this.ToGrowthIndex(X, Y);
        if((i < 0) || (i > this.Growth.length))
        {
            return 0;
        }

        return (this.Growth[i] * (Diagonal ? this.DiagonalNeighborGrowth : this.DirectNeighborGrowth));
    }

    this.SeedNeighbor = function(X, Y)
    {
        var i = this.ToGrowthIndex(X, Y);
        if ((i < 0) || (i > this.Growth.length))
        {
            return;
        }

        if(this.Growth[i] >= 1)
        {
            return;
        }

        var NewDirtyPixel = {X : X, Y :Y };
        var DirtyPixelIndex = this.DirtyPixels.findIndex(function (element, index, array) { return ((element.X == this.X) && (element.Y == this.Y)); }, NewDirtyPixel);

        if(DirtyPixelIndex == -1)
        {
            this.DirtyPixels.push(NewDirtyPixel);
        }
    }

    this.ClearArea = function(X,Y)
    {
        X -= this.ClearRadius;
        Y -= this.ClearRadius;

        for (var y = 0; y < 2 * this.ClearRadius; y++)
            for (var x = 0; x < 2 * this.ClearRadius; x++) {

                var StencilIndex = y * 2 * this.ClearRadius + x;

                var GrowthIndex = this.ToGrowthIndex(X + x, Y + y);
                if ((GrowthIndex > 0) && (GrowthIndex < this.Growth.length))
                {
                    this.Growth[GrowthIndex] *= this.ClearStencil[StencilIndex];
                    if(this.Growth[GrowthIndex] < 1)
                    {
                        this.SeedNeighbor(X + x, Y + y);
                    }
                }
            }
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