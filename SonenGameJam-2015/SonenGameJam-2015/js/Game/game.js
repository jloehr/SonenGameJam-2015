var Game = {
    Canvas: null,
    Context: null,
    FixedTimestep: 30,
    GameLoop : null,
    GrowMap: null,
    Background: null,
    FrameCounter: 0,

    PointerDown: false,

    Init: function()
    {
        this.SetupCanvas();
        this.GrowMap = new GrowMap(this.Canvas, this.Context);
        
        this.Canvas.addEventListener("mousedown", function (event) { Game.OnPointerDown(event) });
        this.Canvas.addEventListener("mousemove", function (event) { Game.OnPointerMove(event) });
        this.Canvas.addEventListener("mouseup", function (event) { Game.OnPointerUp(event) });

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

    OnPointerDown:function(event)
    {
        this.PointerDown = true;
        this.GrowMap.ClearArea(event.clientX, event.clientY);

    },

    OnPointerMove : function(event)
    {
        if (this.PointerDown)
        {
            this.GrowMap.ClearArea(event.clientX, event.clientY);
        }
    },

    OnPointerUp : function(event)
    {
        this.PointerDown = false;
    }
}

function GrowMap(Canvas, Context)
{
    this.Canvas = Canvas;
    this.Context = Context;

    this.GrowImage = null;
    this.GrowImageData = null;
    this.DrawBuffer = null;
    this.DrawBufferData = null;
    this.Growth = null;
    this.DirtyPixelsList = [];
    this.DirtyPixelsArray = [];

    this.SelfGrowth = 1.01;
    this.DirectNeighborGrowth = 0.01;
    this.DiagonalNeighborGrowth = 0.005;

    this.ClearRadius = 15;
    this.ClearSmooth = 5;
    this.ClearStencil = null;

    this.Constructor = function()
    {
        this.GrowImage = this.Context.createImageData(Canvas.width, Canvas.height);
        this.GrowImageData = this.GrowImage.data;
        this.Growth = new Float32Array(Canvas.width * Canvas.height);
        this.ClearStencil = new Float32Array(2 * this.ClearRadius * 2 * this.ClearRadius);

        for (var i = 0; i < this.GrowImageData.length; i += 4)
        {
            this.GrowImageData[i + 0] = 0;
            this.GrowImageData[i + 1] = 255;
            this.GrowImageData[i + 2] = 0;
            this.GrowImageData[i + 3] = 255;
        }

        this.Context.putImageData(this.GrowImage, 0, 0);
        this.DrawBuffer = this.Context.getImageData(0, 0, Canvas.width, Canvas.height);
        this.DrawBufferData = this.DrawBuffer.data;

        this.Growth.fill(1);

        this.CreateClearStencil();

        var X = Math.round(this.Canvas.width / 2);
        var Y = Math.round(this.Canvas.height / 2);

        this.ClearAreaWithRangeAndSmooth(X, Y, 100, 35);

    }

    this.Draw = function(Background)
    {
        var BackgroundData = Background.data;
        for (var i = 0; i < this.DirtyPixelsList.length; i++)
        {
            var Element = this.DirtyPixelsList[i];

            var GrowthIndex = this.ToGrowthIndex(Element.X, Element.Y);
            var PixelIndex = this.ToPixelIndex(Element.X, Element.Y);
            var Blend = Math.min(1, this.Growth[GrowthIndex]);
            this.DrawBufferData[PixelIndex + 0] = BackgroundData[PixelIndex + 0] * (1 - Blend) + this.GrowImageData[PixelIndex + 0] * Blend;
            this.DrawBufferData[PixelIndex + 1] = BackgroundData[PixelIndex + 1] * (1 - Blend) + this.GrowImageData[PixelIndex + 1] * Blend;
            this.DrawBufferData[PixelIndex + 2] = BackgroundData[PixelIndex + 2] * (1 - Blend) + this.GrowImageData[PixelIndex + 2] * Blend;

        }

        this.Context.putImageData(this.DrawBuffer, 0, 0);
    }

    this.Update = function()
    {   
        for (var i = this.DirtyPixelsList.length - 1; i >= 0; i--)
        {
            var Element = this.DirtyPixelsList[i];
            this.Regrow(i, Element.X, Element.Y);
        }
    }

    this.Regrow = function(DirtyIndex, X, Y)
    {
        var i = this.ToGrowthIndex(X, Y);
        if(this.Growth[i] >= 1)
        {
            this.Growth[i] = 1;
            this.DirtyPixelsList.splice(DirtyIndex, 1);
            this.DirtyPixelsArray[i] = false;
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

        if (NewGrowth > 0.05)
        {
            this.Seed(X + 0, Y - 1);
            this.Seed(X + 1, Y - 1);
            this.Seed(X + 1, Y - 0);
            this.Seed(X + 1, Y + 1);
            this.Seed(X + 0, Y + 1);
            this.Seed(X - 1, Y + 1);
            this.Seed(X - 1, Y + 0);
            this.Seed(X - 1, Y - 1);
        }

        if(NewGrowth == 0)
        {
            this.DirtyPixelsList.splice(DirtyIndex, 1);
            this.DirtyPixelsArray[i] = false;
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

    this.Seed = function(X, Y)
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

        if (this.DirtyPixelsArray[i])
        {
            return;
        }

        var NewDirtyPixel = { X: X, Y: Y };
        this.DirtyPixelsList.push(NewDirtyPixel);
        this.DirtyPixelsArray[i] = true;
    }

    this.GetClearValue = function(X, Y, Radius, Smooth)
    {
        var Distance = Math.sqrt(Math.pow(X - Radius, 2) + Math.pow(Y - Radius, 2));
        if (Distance > (Radius - Smooth)) {
            Distance -= Radius - Smooth;
            return Math.min(1, Distance / Smooth);
        }
        else
        {
            return 0;
        }
    }

    this.CreateClearStencil = function()
    {
        for (var y = 0; y < 2 * this.ClearRadius; y++)
            for (var x = 0; x < 2 * this.ClearRadius; x++) {
                var StencilIndex = y * 2 * this.ClearRadius + x;
                this.ClearStencil[StencilIndex] = this.GetClearValue(x, y, this.ClearRadius, this.ClearSmooth);
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
                        this.Seed(X + x, Y + y);
                    }
                }
            }
    }

    this.ClearAreaWithRangeAndSmooth = function(X, Y, Radius, Smooth)
    {
        X -= Radius;
        Y -= Radius;

        for (var y = 0; y < 2 * Radius; y++)
            for (var x = 0; x < 2 * Radius; x++)
            {
                var GrowthIndex = this.ToGrowthIndex(X + x, Y + y);
                if ((GrowthIndex > 0) && (GrowthIndex < this.Growth.length))
                {
                    this.Growth[GrowthIndex] *= this.GetClearValue(x, y, Radius, Smooth)
                    if (this.Growth[GrowthIndex] < 1) {
                        this.Seed(X + x, Y + y);
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