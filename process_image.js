$(function() {      
    $("#open_file_btn").click(function() {
        $("#hidden_file_select_btn").click();
    });

    $("#hidden_file_select_btn").change(function(event) {
        filename = event.target.files[0].name;
        handleImage(event);
    });
  
    $("#show_border,#show_good_pixels,#show_bad_pixels").change(function(event) {
        update_image();
    });
});
      
var filename;        
var in_pixel_array = [];
var good_pixel_array = [];
var bad_pixel_array = [];
var draw_pixel_array = [];

for (var i = 0; i < 196; i++)
{
    in_pixel_array[i] = [];
    good_pixel_array[i] = [];
    bad_pixel_array[i] = [];
    draw_pixel_array[i] = [];
    for (var j = 0; j < 180; j++)
    {
        in_pixel_array[i][j] = 0;
        good_pixel_array[i][j] = 0;
        bad_pixel_array[i][j] = 0;
        draw_pixel_array[i][j] = 0;
    }
}
      
function process_image(img)
{
    var canvas = document.getElementById('mycanvas');
    $("#mycanvas").attr("width",180).attr("height",196);

    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 180, 196);
    ctx.drawImage(img, 0, 0);

    for (var i = 0; i < 196; i++)
    {
        in_pixel_array[i] = [];
        good_pixel_array[i] = [];
        bad_pixel_array[i] = [];
        draw_pixel_array[i] = [];
        for (var j = 0; j < 180; j++)
        {
            in_pixel_array[i][j] = 0;
            good_pixel_array[i][j] = 0;
            bad_pixel_array[i][j] = 0;
            draw_pixel_array[i][j] = 0;
        }
    }

    for (var y = 0; y < 196; y++)
    {
        for (var x = 0; x < 180; x++)
        {
            var data = ctx.getImageData(x, y, 1, 1);
            if (data.data[0] == 0x00 && data.data[1] == 0x00 && data.data[2] == 0x00)
            {
            in_pixel_array[y][x] = 1;
            }
        }
    }

    for (var i = 0; i < 196; i++)
    {
        bad_pixel_array[i] = [];
        for (var j = 0; j < 180; j++)
        {
            bad_pixel_array[i][j] = in_pixel_array[i][j];
        }
    }

    for (var y = 0; y < 196-3; y++)
    {
        for (var x = 0; x < 180-3; x++)
        {
            if (in_pixel_array[y][x] == 1   && in_pixel_array[y][x+1] == 1   && in_pixel_array[y][x+2] == 1   && in_pixel_array[y][x+3] == 1 &&
            in_pixel_array[y+1][x] == 1 && in_pixel_array[y+1][x+1] == 1 && in_pixel_array[y+1][x+2] == 1 && in_pixel_array[y+1][x+3] == 1 &&
            in_pixel_array[y+2][x] == 1 && in_pixel_array[y+2][x+1] == 1 && in_pixel_array[y+2][x+2] == 1 && in_pixel_array[y+2][x+3] == 1 &&
            in_pixel_array[y+3][x] == 1 && in_pixel_array[y+3][x+1] == 1 && in_pixel_array[y+3][x+2] == 1 && in_pixel_array[y+3][x+3] == 1)
            {
                for (var i = 0; i < 4; i++)
                {
                    for (var j = 0; j < 4; j++)
                    {
                    bad_pixel_array[y+i][x+j] = 0;
                    good_pixel_array[y+i][x+j] = 1;
                    }
                }
				
            draw_pixel_array[y+3][x] = 1;
            }
        }
    }

    var bad_pixel_count = 0;
        for (var y = 0; y < 196-3; y++)
        {
            for (var x = 0; x < 180-3; x++)
            {
                if (bad_pixel_array[y][x] == 1)
                {
                bad_pixel_count++;
                }
            }
        }

    $("#bad_pixel_count").html(bad_pixel_count + " bad pixels");
}

function update_image()
{
    var canvas = document.getElementById('mycanvas');
    var ctx = canvas.getContext('2d');

    var offset = 0;

    if ($("#show_border").prop("checked"))
    {
        $("#mycanvas").attr("width",192).attr("height",208);
        ctx.clearRect(0, 0, 192, 208);
        draw_border(ctx);
        offset = 6;
    }
    else
    {
        $("#mycanvas").attr("width",180).attr("height",196);
        ctx.clearRect(0, 0, 180, 196);
        offset = 0;
    }

    if ($("#show_good_pixels").prop("checked"))
    {
        var fill_pixel = ctx.createImageData(1, 1);
        fill_pixel.data[0] = 0x00;
        fill_pixel.data[1] = 0x00;
        fill_pixel.data[2] = 0x00;
        fill_pixel.data[3] = 0xFF;

        for (var y = 0; y < 196; y++)
        {
            for (var x = 0; x < 180; x++)
            {
                if (good_pixel_array[y][x] == 1)
                {
                ctx.putImageData(fill_pixel, x+offset, y+offset);
                }
            }
        }
    }

    if ($("#show_bad_pixels").prop("checked"))
    {
        var fill_pixel = ctx.createImageData(1, 1);
        fill_pixel.data[0] = 0xFF;
        fill_pixel.data[1] = 0x00;
        fill_pixel.data[2] = 0x00;
        fill_pixel.data[3] = 0xFF;

        for (var y = 0; y < 196; y++)
        {
            for (var x = 0; x < 180; x++)
            {
                if (bad_pixel_array[y][x] == 1)
                {
                ctx.putImageData(fill_pixel, x+offset, y+offset);
                }
            }
        }
    }
}

function draw_border(ctx)
{
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#dedfde";
    ctx.moveTo(0,0.5);
    ctx.lineTo(192,0.5);
    ctx.moveTo(0,1.5);
    ctx.lineTo(192,1.5);
    ctx.moveTo(0,2.5);
    ctx.lineTo(192,2.5);
    ctx.moveTo(0,3.5);
    ctx.lineTo(192,3.5);

    ctx.moveTo(0,204.5);
    ctx.lineTo(192,204.5);
    ctx.moveTo(0,205.5);
    ctx.lineTo(192,205.5);
    ctx.moveTo(0,206.5);
    ctx.lineTo(192,206.5);
    ctx.moveTo(0,207.5);
    ctx.lineTo(192,207.5);

    ctx.moveTo(0.5,0);
    ctx.lineTo(0.5,208);
    ctx.moveTo(1.5,0);
    ctx.lineTo(1.5,208);
    ctx.moveTo(2.5,0);
    ctx.lineTo(2.5,208);
    ctx.moveTo(3.5,0);
    ctx.lineTo(3.5,208);

    ctx.moveTo(188.5,0);
    ctx.lineTo(188.5,208);
    ctx.moveTo(189.5,0);
    ctx.lineTo(189.5,208);
    ctx.moveTo(190.5,0);
    ctx.lineTo(190.5,208);
    ctx.moveTo(191.5,0);
    ctx.lineTo(191.5,208);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "#bdbebd";

    ctx.moveTo(4,4.5);
    ctx.lineTo(188,4.5);
    ctx.moveTo(4,5.5);
    ctx.lineTo(188,5.5);

    ctx.moveTo(4.5,4);
    ctx.lineTo(4.5,204);
    ctx.moveTo(5.5,4);
    ctx.lineTo(5.5,204);

    ctx.moveTo(4,202.5);
    ctx.lineTo(188,202.5);
    ctx.moveTo(4,203.5);
    ctx.lineTo(188,203.5);

    ctx.moveTo(186.5,4);
    ctx.lineTo(186.5,204);
    ctx.moveTo(187.5,4);
    ctx.lineTo(187.5,204);
    ctx.stroke();
}

function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            process_image(img);
            update_image();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);     
}


function download_image()
{
    var canvas = document.getElementById('mycanvas');
    var bb = dataURLToBlob(canvas.toDataURL("image/png"));

    var a = $("<a style=\"display: none\">This should never be seen</a>");

    a[0].download = filename.substring(0,filename.length-4) + "_FIX.png";
    a[0].href = window.URL.createObjectURL(bb);
    a[0].textContent = 'Download ready';

    a[0].dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a[0].click();
}

function download_coords()
{
    // Creates a list of all possible co-ordinates to draw at in
    // Brain Age
    var data = ["B","A","T","S","\0","\0","\0","\0x1"];
    var ix = 0;

    for(var y = 0; y < 196; y++) {
        for(var x = 0; x < 180; x++) {
			if(draw_pixel_array[y][x] === 1) {
				data.push(String.fromCharCode(x));
				data.push(String.fromCharCode(y));
				}
        }
    }

    var file = new Blob(data);

    var a = $("<a style=\"display: none\">This should never be seen</a>");

    a[0].download = filename.substring(0,filename.length-4) + "_COORDS.bats";
    a[0].href = window.URL.createObjectURL(file);
    a[0].textContent = 'Download ready';

    a[0].dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a[0].click();
}

function download_lua(coordinates)
{
    // Creates a lua script to input all coordinates
    var data = [];
    data.push("local off_screen = { };\n");
    data.push("off_screen[\"x\"] = 150;\n");
    data.push("off_screen[\"y\"] = 0;\n");
    data.push("off_screen[\"touch\"] = true ;\n\n");
    data.push("local touch_data = { };\n");
    data.push("touch_data[\"touch\"] = true ;\n\n");
    
    var ix = 0;

    for(var y = 0; y < 196; y++) {
        for(var x = 0; x < 180; x++) {
        if(coordinates[y][x] === 1) {
            data.push("touch_data[\"x\"] = " + (248-y) + ";\n");
            data.push("touch_data[\"y\"] = " + (x+5) + ";\n");
            data.push("stylus.set(touch_data);\n");
            data.push("emu.frameadvance();\n");
            data.push("stylus.set(touch_data);\n");
            data.push("emu.frameadvance();\n");
            data.push("stylus.set(off_screen);\n");
            data.push("emu.frameadvance();\n");
            }
        }
    }
    data.push("emu.pause();\n");

    var file = new Blob(data);

    var a = $("<a style=\"display: none\">This should never be seen</a>");

    a[0].download = filename.substring(0,filename.length-4) + "_LUA.lua";
    a[0].href = window.URL.createObjectURL(file);
    a[0].textContent = 'Download ready';

    a[0].dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a[0].click();
}


function dataURLToBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);

        return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}

