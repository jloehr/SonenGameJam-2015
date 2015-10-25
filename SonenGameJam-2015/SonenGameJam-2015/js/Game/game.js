var GlobalSettings = {
    Tower: {
        Size: 50,
        MaxOvergrowth: 0.75,
    },
 
    Generator: {
        Size: 30,
        MaxOvergrowth: 0.75,
        Range: 100,
    },

    Degenerator: {
        Width: 200,
        Height: 150,
        MaxOvergrowth: 0.2,
    },
}

var Game = {
    Canvas: null,
    Context: null,

    FixedTimestep: 30,
    GameLoop: null,
    DefeatVictoryTimer: 1000,
    DefeatCheck: null,
    VictoryCheck: null,


    GrowMap: null,
    Background: null,

    Buildings: [],
    Towers: [],
    Generators: [],
    Degenerator: [],

    LaserSkill: null,
    TowerBuildSkill: null,
    GeneratorBuildSkill: null,
    ActiveSkill: null,

    PointerDown: false,
    Defeated: false,
    Victory: false,

    NameBlend: 1.0,
    NameBlendDrain: 0.01,

    Init: function()
    {
        this.SetupCanvas();
        this.GrowMap = new GrowMap(this.Canvas, this.Context);

        this.LaserSkill = new LaserSkill(this.Towers);
        this.TowerBuildSkill = new BuildTowerSkill(this.Towers, this.Buildings, this.GrowMap);
        this.GeneratorBuildSkill = new BuildGeneratorSkill(this.Generators, this.Towers, this.Buildings, this.GrowMap);
        
        this.Canvas.addEventListener("mousedown", function (event) { Game.OnPointerDown(event) });
        this.Canvas.addEventListener("mousemove", function (event) { Game.OnPointerMove(event) });
        this.Canvas.addEventListener("mouseup", function (event) { Game.OnPointerUp(event) });

        this.ActiveSkill = this.LaserSkill;
        this.ActiveSkill.Button.disabled = true;

        this.Start();

        this.Draw();

        this.GameLoop = window.setInterval(function () { Game.Tick(); }, this.FixedTimestep);
        this.DefeatCheck = window.setInterval(function () { Game.CheckForDefeat(); }, this.DefeatVictoryTimer);
        this.VictoryCheck = window.setInterval(function () { Game.CheckForVictory(); }, this.DefeatVictoryTimer);
    },

    Start: function()
    {
        var X = Math.round(this.Canvas.width / 2);
        var Y = Math.round(this.Canvas.height / 2);


        var NewDegenerator = new Degenerator(X, Y, this.GrowMap)
        this.Degenerator.push(NewDegenerator);
        this.Buildings.push(NewDegenerator);

        Y = Math.round(Y + GlobalSettings.Degenerator.Height / 2 + GlobalSettings.Tower.Size / 2 + 10);
        this.GrowMap.ClearAreaWithRangeAndSmooth(X, Y, 100, 35);

        var NewTower = new Tower(X, Y, this.GrowMap)
        this.Towers.push(NewTower);
        this.Buildings.push(NewTower);

        Y += GlobalSettings.Tower.Size / 2 + GlobalSettings.Generator.Size / 2 + 10;
        var NewGenerator = new Generator(X, Y , NewTower, this.GrowMap);
        this.Generators.push(NewGenerator);
        this.Buildings.push(NewGenerator);
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
        if (!this.Victory)
        {
            this.GrowMap.Update();
        }

        for (var i = 0; i < this.Buildings.length; i++) {
            this.Buildings[i].Update()
        }
    },

    Draw : function()
    {
        this.GrowMap.Draw(this.Background);

        for (var i = 0; i < this.Buildings.length; i++) {
            this.Buildings[i].Draw(this.Context);
        }

        for (var i = 0; i < this.Buildings.length; i++) {
            this.Buildings[i].DrawEffects(this.Context);
        }


        if (this.NameBlend > 0)
        {
            var TextLineTmp = this.Context.lineWidth;
            this.Context.lineWidth = 5;

            var Text = "Overgrowth";

            this.Context.globalAlpha = this.NameBlend;

            this.Context.textAlign = "center";
            this.Context.fillStyle = "rgb(173, 255, 47)";
            this.Context.strokeStyle = "rgb(0, 100, 0)";
            this.Context.font = "bold 10em sans-serif";
            this.Context.fillText(Text, this.Canvas.width / 2, this.Canvas.height / 4);
            this.Context.strokeText(Text, this.Canvas.width / 2, this.Canvas.height / 4);

            this.Context.lineWidth = TextLineTmp;

            this.Context.globalAlpha = 1;
            this.NameBlend -= this.NameBlendDrain;
        }

        if(this.Defeated)
        {
            var TextLineTmp = this.Context.lineWidth;
            this.Context.lineWidth = 5;

            var Text = "Defeat";

            this.Context.textAlign = "center";
            this.Context.fillStyle = "red";
            this.Context.strokeStyle = "black";
            this.Context.font = "bold 10em sans-serif";
            this.Context.fillText(Text, this.Canvas.width / 2, this.Canvas.height / 2);
            this.Context.strokeText(Text, this.Canvas.width / 2, this.Canvas.height / 2);

            this.Context.lineWidth = TextLineTmp;
        }

        if (this.Victory)
        {
            var TextLineTmp = this.Context.lineWidth;
            this.Context.lineWidth = 5;

            var Text = "Victory";

            this.Context.textAlign = "center";
            this.Context.fillStyle = "green";
            this.Context.strokeStyle = "black";
            this.Context.font = "bold 10em sans-serif";
            this.Context.fillText(Text, this.Canvas.width / 2, this.Canvas.height / 2);
            this.Context.strokeText(Text, this.Canvas.width / 2, this.Canvas.height / 2);

            this.Context.lineWidth = TextLineTmp;
        }
    },

    CheckForDefeat : function()
    {
        var Defeat = true;

        for (var i = 0; i < this.Towers.length; i++)
        {
            if(!this.Towers[i].CheckForOvergrow())
            {
                Defeat = false;
                break;
            }
        }

        if(Defeat)
        {
            this.Defeated = true;
            clearInterval(this.DefeatCheck);
            clearInterval(this.VictoryCheck);
            console.log("Defeat");
        }
    },
    
    CheckForVictory: function ()
    {
        var Victory = true;

        for (var i = 0; i < this.Degenerator.length; i++) {
            if (this.Degenerator[i].CheckForOvergrow()) {
                Victory = false;
                break;
            }
        }

        if (Victory)
        {
            this.Victory = true;
            clearInterval(this.DefeatCheck);
            clearInterval(this.VictoryCheck);
            console.log("Victory");
        }
    },

    OnPointerDown:function(event)
    {
        this.PointerDown = true;
        this.ActiveSkill.PointerDown(event);

    },

    OnPointerMove : function(event)
    {
        if (this.PointerDown)
        {
            this.ActiveSkill.PointerMove(event);
        }
    },

    OnPointerUp : function(event)
    {
        this.PointerDown = false;
        this.ActiveSkill.PointerUp(event);
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
    this.DirectNeighborGrowth = 0.005;
    this.DiagonalNeighborGrowth = 0.001;

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

    this.GetOvergrownValueRect = function(X, Y, Width, Heigth)
    {
        var Value = 0;

        for (var y = Math.round(Y - Heigth / 2) ; y < Y + Heigth / 2; y++)
            for (var x = Math.round(X - Width / 2) ; x < X + Width / 2; x++)
            {
                var i = this.ToGrowthIndex(x, y);
                Value += this.Growth[i];
            }

        return Value/(Width * Heigth);
    }

    this.Constructor();
}

function Building(X, Y, Width, Height, GrowMap, MaxOvergrowth)
{
    this.X = X;
    this.Y = Y;
    this.Width = Width;
    this.Height = Height;

    this.GrowMap = GrowMap;
    this.MaxOvergrowth = MaxOvergrowth;

    this.Active = true;

    this.CheckForOvergrow = function (Verbose) {
        var OvergrowthValue = this.GrowMap.GetOvergrownValueRect(this.X, this.Y, this.Width, this.Height)
        this.Active = (OvergrowthValue < this.MaxOvergrowth);

        if (Verbose)
        {
            console.log(OvergrowthValue)
        }

        return !this.Active;
    }

    this.IsColliding = function (X, Y, Width, Height)
    {
        return ((Math.abs(X - this.X) > (Width/2 + this.Width/2)) || (Math.abs(Y - this.Y) > (Height/2 + this.Height/2)));
    }

    this.Update = function()
    {

    }
    
    this.Draw = function(Context)
    {
        this.DrawOutline(Context);
    }

    this.DrawEffects = function (Context) {

    }


    this.DrawOutline = function(Context)
    {
        Context.strokeStyle = "black";
        Context.strokeRect(this.X - this.Width / 2, this.Y - this.Height / 2, this.Width, this.Height);
    }
}

function Tower(X,Y, GrowMap)
{
    this.__proto__ = new Building(X, Y, GlobalSettings.Tower.Size, GlobalSettings.Tower.Size, GrowMap, GlobalSettings.Tower.MaxOvergrowth);

    this.Range = 150;

    this.LazerTarget = null;
    this.DashLineOffset = 0;
    this.DashLineSpeed = 2;

    this.MaxEnergy = 100;
    this.Energy = this.MaxEnergy;
    this.EnergyDrain = 1;

    this.Constructor = function()
    {

    }

    this.Update = function()
    {

    }

    this.Draw = function(Context)
    {
        this.DrawOutline(Context);

        var TWidth = this.Width * 0.3;
        var THeight = this.Height * 0.3;
        Context.strokeStyle = "black";
        Context.beginPath()
        Context.moveTo(this.X - TWidth, this.Y - THeight);
        Context.lineTo(this.X + TWidth, this.Y - THeight);
        Context.moveTo(this.X, this.Y - THeight);
        Context.lineTo(this.X, this.Y + THeight);
        Context.stroke();

        var EnergyBarHeight = this.Height * 0.1;
        var EnergyBarPosition = this.Y + this.Height * 0.35;
        var EnergyBarWidth = this.Width * 0.8;
        var EnergyWidth = this.Energy / this.MaxEnergy * EnergyBarWidth;

        Context.fillStyle = "lightblue";
        Context.fillRect(this.X + EnergyBarWidth / 2 - EnergyWidth, EnergyBarPosition, EnergyWidth, EnergyBarHeight);
        Context.strokeStyle = "blue";
        Context.strokeRect(this.X - EnergyBarWidth / 2, EnergyBarPosition, EnergyBarWidth, EnergyBarHeight);
        
    }

    this.DrawEffects = function(Context)
    {
        if (this.LazerTarget)
        {
            var Size = 10;

            var Gradient = Context.createRadialGradient(this.LazerTarget.X, this.LazerTarget.Y, Size, this.LazerTarget.X, this.LazerTarget.Y, 0);
            Gradient.addColorStop(1, "orange");
            Gradient.addColorStop(0, "rgba(255,165,0,0)");
            Context.fillStyle = Gradient;
            Context.fillRect(this.LazerTarget.X - Size, this.LazerTarget.Y - Size, Size * 2, Size * 2);

            Context.lineWidth = 2;
            Context.strokeStyle = "orange";
            Context.beginPath()
            Context.moveTo(this.X, this.Y);
            Context.lineTo(this.LazerTarget.X, this.LazerTarget.Y);
            Context.stroke();

            Context.globalAlpha = 0.75;

            Context.setLineDash([5, 2.5]);
            Context.lineDashOffset = this.DashLineOffset;
            this.DashLineOffset -= this.DashLineSpeed;
            Context.strokeStyle = "yellow";
            Context.beginPath()
            Context.moveTo(this.X, this.Y);
            Context.lineTo(this.LazerTarget.X, this.LazerTarget.Y);
            Context.stroke();

            Context.lineDashOffset = 0;
            Context.setLineDash([]);
            Context.globalAlpha = 1;
            Context.lineWidth = 1;


            this.LazerTarget = null;
        }
    }

    this.InRange = function(X, Y)
    {
        var Range = Math.sqrt(Math.pow(this.X - X, 2) + Math.pow(this.Y - Y, 2));

        return (Range < this.Range) ? Range : NaN;
    }

    this.GetShootingValue = function(X, Y)
    {
        if (this.Energy < this.EnergyDrain)
        {
            return NaN;
        }

        var InRange = this.InRange(X, Y);

        if (InRange != NaN)
        {
            this.CheckForOvergrow();
        }

        return (this.Active) ? InRange : NaN;
    }

    this.Fire = function(X, Y)
    {
        this.GrowMap.ClearArea(X, Y);
        this.LazerTarget = { X: X, Y: Y };
        this.Energy -= this.EnergyDrain;
    }

    this.Constructor();
}

function Generator(X, Y, Tower, GrowMap)
{
    this.__proto__ = new Building(X, Y, GlobalSettings.Generator.Size, GlobalSettings.Generator.Size, GrowMap, GlobalSettings.Generator.MaxOvergrowth);

    this.Tower = Tower;

    this.Efficency = 0.2;

    this.DashLineOffset = 0;
    this.DashLineSpeed = 1;
    this.EnergyProduced = false;

    this.Constructor = function () {

    }
    
    this.Draw = function(Context)
    {
        this.DrawOutline(Context);

        var Width = this.Width * 0.2;
        var Height = this.Height * 0.3;
        Context.strokeStyle = "black";
        Context.beginPath()
        Context.arc(this.X, this.Y, this.Width * 0.4, Math.PI*1.7, 0, true);
        Context.lineTo(this.X, this.Y);
        Context.stroke();
    }

    this.DrawEffects = function(Context)
    {
        if (this.EnergyProduced) {
            Context.setLineDash([15, 5]);
            Context.lineDashOffset = this.DashLineOffset;
            this.DashLineOffset -= this.DashLineSpeed;
        }
        else {
            Context.setLineDash([10, 15]);
        }

        Context.strokeStyle = "lightblue";
        Context.beginPath()
        Context.moveTo(this.X, this.Y);
        Context.lineTo(this.Tower.X, this.Tower.Y);
        Context.stroke();
        Context.setLineDash([]);
        Context.lineDashOffset = 0;
    }

    this.Update = function()
    {
        if (!this.CheckForOvergrow())
        {
            this.Tower.Energy = Math.min(this.Tower.MaxEnergy, this.Tower.Energy + this.Efficency);
            this.EnergyProduced = (this.Tower.Energy < this.Tower.MaxEnergy);
        }
        else
        {
            this.EnergyProduced = false;
        }
    }

    this.Constructor();
}

function Degenerator(X, Y, GrowMap)
{
    this.__proto__ = new Building(X, Y, GlobalSettings.Degenerator.Width, GlobalSettings.Degenerator.Height, GrowMap, GlobalSettings.Degenerator.MaxOvergrowth);

    this.Draw = function (Context) {
        this.DrawOutline(Context);

        var TextHeight = this.Height / 5;

        Context.textAlign = "center";
        Context.fillStyle = "black";
        Context.font = "bold " + TextHeight + "px sans-serif";
        Context.fillText("Degenerator", this.X, this.Y);

        var HintHeight = this.Height / 7.5;
        Context.font = HintHeight +"px sans-serif";
        Context.fillText("Clean Me", this.X, this.Y + TextHeight * 1.2);
    }
}


function Skill(ButtonID, Parent)
{
    this.Button = document.getElementById(ButtonID);
    this.Button.Skill = Parent;

    this.Constructor = function()
    {
        this.Button.addEventListener("click", function () { this.Skill.OnSkillButtonClick(); });
    }

    this.PointerDown = function(event)
    {

    }

    this.PointerMove = function(event)
    {

    }

    this.PointerUp = function(event)
    {

    }

    this.OnSkillButtonClick = function ()
    {
        Game.ActiveSkill.Button.disabled = false;
        Game.ActiveSkill = this;
        Game.ActiveSkill.Button.disabled = true;

    }

    this.Constructor();
}

function LaserSkill(Towers)
{
    this.__proto__ = new Skill("LaserSkill", this);
    this.Towers = Towers;

    this.PointerDown = function (event) {
        this.Fire(event);
    }

    this.PointerMove = function (event) {
        this.Fire(event);
    }

    this.Fire = function(event)
    {
        var BestTower = this.GetBestTower(event.clientX, event.clientY);
        if (BestTower != null) {
            BestTower.Fire(event.clientX, event.clientY);
        }
    }

    this.GetBestTower = function(X, Y)
    {
        var SmallestRange = Number.MAX_VALUE;
        var BestIndex = NaN;
        for (var i = 0; i < this.Towers.length; i++)
        {
            var Range = this.Towers[i].GetShootingValue(X, Y);
            if((Range != NaN) && (Range < SmallestRange))
            {
                SmallestRange = Range;
                BestIndex = i;
            }
        }

        return (BestIndex != NaN) ? this.Towers[BestIndex] : null;
    }
}

var Util = {
    CheckBuildingPlace : function(X,Y, Width, Height, Buildings)
    {
        var WillFit = true;
        for (var i = 0; i < Buildings.length; i++) {
            WillFit = WillFit && Buildings[i].IsColliding(X, Y, Width, Height);
        }

        return WillFit;
    }
}

function BuildTowerSkill(Towers, Buildings, GrowMap)
{
    this.__proto__ = new Skill("BuildTowerSkill", this);
    this.Buildings = Buildings;
    this.Towers = Towers;
    this.GrowMap = GrowMap;

    this.PointerUp = function (event)
    {
        var X = event.clientX;
        var Y = event.clientY;

        var ValidPlace = Util.CheckBuildingPlace(X, Y, GlobalSettings.Tower.Size, GlobalSettings.Tower.Size, this.Buildings);

        if (ValidPlace)
        {
            var NewTower = new Tower(X, Y, this.GrowMap);
            this.Towers.push(NewTower);
            this.Buildings.push(NewTower);
        }
    }
}

function BuildGeneratorSkill(Generators, Towers, Buildings, GrowMap)
{
    this.__proto__ = new Skill("BuildGeneratorSkill", this);
    this.Buildings = Buildings;
    this.Generators = Generators;
    this.Towers = Towers;
    this.GrowMap = GrowMap;


    this.PointerUp = function (event) {
        var X = event.clientX;
        var Y = event.clientY;

        var ValidPlace = Util.CheckBuildingPlace(X, Y, GlobalSettings.Generator.Size, GlobalSettings.Generator.Size, this.Buildings);

        var ClosestTower = this.GetClosestTower(X, Y);

        ValidPlace = ValidPlace && (ClosestTower != null);

        if (ValidPlace) {
            var NewGenerator = new Generator(X, Y, ClosestTower, this.GrowMap);
            this.Generators.push(NewGenerator);
            this.Buildings.push(NewGenerator);
        }
    }

    this.GetClosestTower = function(X,Y)
    {
        var Tower = null;
        var ClosestDistance = Number.MAX_VALUE;

        for (var i = 0; i < Towers.length; i++)
        {
            var CurrentTower = Towers[i];
            var Distance = Math.sqrt(Math.pow(X - CurrentTower.X, 2) + Math.pow(Y - CurrentTower.Y, 2));

            if((Distance < GlobalSettings.Generator.Range) && (Distance < ClosestDistance))
            {
                Tower = CurrentTower;
                ClosestDistance = Distance;
            }
        }

        return Tower;
    }
}