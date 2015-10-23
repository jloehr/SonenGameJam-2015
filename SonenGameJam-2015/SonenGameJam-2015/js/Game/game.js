var Game = {
    Canvas: null,
    Context: null,
    FixedTimestep: 30,

    Init: function()
    {
        this.SetupCanvas();
        window.setInterval(function () { Game.Update(); }, this.FixedTimestep);
    },

    SetupCanvas : function()
    {
        this.Canvas = document.getElementById("GameScreen");
        this.Canvas.width = window.innerWidth;
        this.Canvas.height = window.innerHeight;
        this.Context = this.Canvas.getContext("2d");
    },

    Update : function()
    {
        this.Context.fillStyle = "#FF0000";
        this.Context.fillRect(0, 0, this.Canvas.width, this.Canvas.height);
    }


}