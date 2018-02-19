var c = document.getElementById("c");
var ctx = c.getContext("2d");

//making the canvas full screen
//c.height = window.innerHeight;
c.height = 200; 
//c.width = window.innerWidth;
c.width = 600; 


var coins = [
    ["BITCOIN","#1E90FF", 64],
    ["ETHEREUM","#1E90FF", 160],
    ["NEO","#FFF", 240],
    ["LISK","#FFF", 280],
    ["WAVES","#FFF", 320]
]

var timers = {
    "BC": 0,
    "BITCOIN": 0,
    "ETHEREUM": 0,
    "NEO": 0,
    "LISK": 0,
    "WAVES": 0,
}

var times = {
    "BC": [],
    "BITCOIN": [],
    "ETHEREUM": [],
    "NEO": [],
    "LISK": [],
    "WAVES": [],
}

var font_size = 20;
var columns = c.width/24; //number of columns for the rain
//an array of drops - one per column
var drops = [];
var lineLoc = 0;
var last = 0;
var block = 0;
var bonus = 0;

function average(a){

    if(a.length < 3){
        return 0; 
    } 

    var s = a.reduce(function(a, i){
        a = a+i;
        return a;
    }, 0);

    return Math.floor(s/a.length, 2) / 1000;

}

//x below is the x coordinate
//1 = y co-ordinate of the drop(same for every drop initially)
for(var x = 0; x < columns; x++)
    drops[x] = 1; 

//drawing the characters
function draw()
{
    //Black BG for the canvas
    //translucent BG to show trail
    //
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, c.width, c.height);
    
    ctx.fillStyle = "#1E90FF"; 
    ctx.font = font_size + "px arial";
    //looping over drops
    for(var i = 0; i < drops.length; i++)
    {
        //a random chinese character to print
        var selection = Math.floor(Math.random()*coins.length);
        var selection = Math.floor(Math.random()*10000);

        if(selection % 165 === 0){
            s = 0;
        } else if(selection % 77 === 0){
            s = 1;
        } else if(selection % 50 === 0){
            s = 3;
        } else if(selection % 25 === 0){
            s = 4;
        } else if(selection % 20 === 0){
            s = 2;
        } else {
           setTimeout(draw, 63);
           return; 
        }

        var text = coins[s][0];
        var color = coins[s][1];
        //x = i*font_size, y = value of drops[i]*font_size
        //x = i*text.length*4;
        x = coins[s][2];

        lineLoc++;


        if(timers[text] == 0){
            timers[text] = Number(new Date());
        } else {
            var diff = Number(new Date()) - timers[text];
            times[text].push(diff);
            timers[text] = Number(new Date());
        }

        if(text != last){

            if(timers["BC"] == 0){
                timers["BC"] = Number(new Date());
            } else {
                var diff = Number(new Date()) - timers["BC"];
                times["BC"].push(diff);
                timers["BC"] = Number(new Date());
            }
            block++;
            last = text; 
            ctx.beginPath();
            ctx.moveTo(0,lineLoc+15);
            ctx.lineTo(600,lineLoc+15);
            ctx.strokeStyle="#FFF";
            ctx.stroke();
            $("#block").text(block);
            bonus = 0;
            $("#bonus").text(0);
            $("#BC").text(average(times["BC"]));
        } else {
            bonus++;
            $("#bonus").text(bonus * bonus  / 100);
        }

        ctx.fillText(text, x, lineLoc+10);
        $("#"+text).text(average(times[text]));

        $("#mutation").text(lineLoc);


        
        //sending the drop back to the top randomly after it has crossed the screen
        //adding a randomness to the reset to make the drops scattered on the Y axis
        if(drops[i]*12 > c.height && Math.random() > 0.975)
            drops[i] = 0;

        if(lineLoc > c.height)
            lineLoc = 0;
        
        //incrementing Y coordinate
        drops[i]++;


    }

    setTimeout(draw, 1400);

}

draw();





