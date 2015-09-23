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
    
    $("#copy_draw_to_grid_btn").click(function() {
        resize_grid_canvas()
        
        clear_small_canvas()
        copy_pixel_array(draw_pixel_array, 0x00, 0x00, 0x00, 0xff)
        
        copy_small_to_big();
        draw_grid()

    });
    
    $("#coords_canvas").click(function(event) {
      var canvas = $("#coords_canvas")[0];
      var mousePos = getMousePos(canvas, event);
      $("#coords_textbox").val($("#coords_textbox").val() + (Math.floor(mousePos.x/multiple)) + "," + (Math.floor(mousePos.y/multiple)) + "\n");
      clear_small_canvas()
      clear_large_canvas()
      process_coords_list()
      copy_pixel_array(good_pixel_array, 0xaf, 0xaf, 0xaf, 0xff)
      copy_pixel_array(draw_pixel_array, 0x00, 0x00, 0x00, 0xff)
      add_expanded_paths()
      draw_paths()
      copy_small_to_big();
      draw_grid()
    });
    
    multiple = parseInt($("#multiple").val());
});

function add_expanded_paths()
{
  var canvas = document.getElementById('small_coords_canvas');
  var ctx = canvas.getContext('2d');

  var light_pixel = ctx.createImageData(1, 1);
  light_pixel.data[0] = 0xc3
  light_pixel.data[1] = 0xd5
  light_pixel.data[2] = 0xc3
  light_pixel.data[3] = 0xff
  
  var dark_pixel = ctx.createImageData(1, 1);
  dark_pixel.data[0] = 0x6f
  dark_pixel.data[1] = 0x81
  dark_pixel.data[2] = 0x6f
  dark_pixel.data[3] = 0xff
  
  for (var y = 0; y < 196; y++)
  {
    for (var x = 0; x < 180; x++)
    {
      if (expanded_paths_pixel_array[y][x] == 1)
      {
        if (draw_pixel_array[y][x] == 1)
        {
            ctx.putImageData(dark_pixel, x, y);
        }
        else
        {
            ctx.putImageData(light_pixel, x, y);
        }
      }
    }
  }
}


var multiple;
var png = document.createElement('img');


function download_coordlist_lua(coordinates)
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
    
    var lines = $("#coords_textbox").val().split("\n");

    for (var i = 0; i < lines.length; i++)
    {
        if (lines[i]!= "")
        {
            var values = lines[i].split(",");

            if (values.length < 2)
            {
              console.log("Illegal line: " + lines[i]);
              continue;
            }

            var x = parseInt(values[0]);
            var y = parseInt(values[1]);
            
            if (x < 0 || x > 179 || y < 0 || y > 195)
            {
              console.log("Illegal coord: " + x + ", " + y);
              continue;
            }

          
            data.push("touch_data[\"x\"] = " + (248-y) + ";\n");
            data.push("touch_data[\"y\"] = " + (x+5) + ";\n");
            data.push("stylus.set(touch_data);\n");
            data.push("emu.frameadvance();\n");
        }
        else
        {
            data.push("stylus.set(off_screen);\n");
            data.push("emu.frameadvance();\n");
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


var start_points = [];
var mid_points = [];
var control_points = [];
var end_points = [];

function process_coords_list()
{
    for (var i = 0; i < 196; i++)
    {
        start_points[i] = [];
        mid_points[i] = [];
        control_points[i] = [];
        end_points[i] = [];
        for (var j = 0; j < 180; j++)
        {
            start_points[i][j] = 0;
            mid_points[i][j] = 0;
            control_points[i][j] = 0;
            end_points[i][j] = 0;
        }
    }
      
    paths_pixel_array = [];
    for (var i = 0; i < 196; i++)
    {
        paths_pixel_array[i] = [];
        for (var j = 0; j < 180; j++)
        {
            paths_pixel_array[i][j] = 0;
        }
    }

    // line by line in coords
    // get x and y
    // if first point, draw a green pixel
    // if not, draw yellow
    // mid points, draw blue
    var line_started = false;
    var lines = $("#coords_textbox").val().split("\n");
    var prev_x = 0;
    var prev_y = 0;
    for (var i = 0; i < lines.length; i++)
    {
        if (lines[i]!= "")
        {
            var values = lines[i].split(",");

            if (values.length < 2)
            {
                console.log("Illegal line: " + lines[i]);
                continue;
            }

            var x = parseInt(values[0]);
            var y = parseInt(values[1]);
            
            if (x < 0 || x > 179 || y < 0 || y > 195)
            {
                console.log("Illegal coord: " + x + ", " + y);
                continue;
            }

            if (line_started)
            {
                var dist_x = x - prev_x;
                var dist_y = y - prev_y;
                if (dist_x == 0)
                {
                    // vertical line
                    if (Math.abs(dist_y) > 1)
                    {
                        if (prev_y < y)
                        {
                            // down
                            for (var new_y = prev_y + 1; new_y < y; new_y++)
                            {
                                mid_points[new_y][x] = 1;
                                paths_pixel_array[new_y][x] = 1;
                            }
                        }
                        else
                        {
                            // up
                            for (var new_y = y + 1; new_y < prev_y; new_y++)
                            {
                                mid_points[new_y][x] = 1;
                                paths_pixel_array[new_y][x] = 1;
                            }
                        }
                    }
                }
                else if (dist_y == 0)
                {
                    // horizontal line
                    if (Math.abs(dist_x) > 1)
                    {
                        if (prev_x < x)
                        {
                            // down
                            for (var new_x = prev_x + 1; new_x < x; new_x++)
                            {
                                mid_points[y][new_x] = 1;
                                paths_pixel_array[y][new_x] = 1;
                            }
                        }
                        else
                        {
                            // up
                            for (var new_x = x + 1; new_x < prev_x; new_x++)
                            {
                                mid_points[y][new_x] = 1;
                                paths_pixel_array[y][new_x] = 1;
                            }
                        }
                    }
                }
                else
                {
                    var x0 = x;
                    var y0 = y;
                    
                    var x1 = prev_x;
                    var y1 = prev_y;
                    
                    var dx_a = Math.abs(x1 - x0);
                    var dy_a = Math.abs(y1 - y0);
                    
                    if ((dy_a > dx_a && prev_y > y0) || (dx_a > dy_a && prev_x < x))
                    {
                        x0 = prev_x;
                        y0 = prev_y;
                        
                        x1 = x;
                        y1 = y;
                    }
                    
                    var dx = x1 - x0;
                    var dy = y1 - y0;
                    
                    var sx = x1 - x0 > 0 ? 1 : -1;
                    var sy = y1 - y0 > 0 ? 1 : -1;
                    
                    var value = 0;
                   
                    while (true)
                    {
                        mid_points[y0][x0] = 1;
                        paths_pixel_array[y0][x0] = 1;
                        if (x0 === x1 && y0 === y1) break;
                        if (dx_a > dy_a)
                        {
                            if (x0 > x1)
                            {
                                console.log("ERR")
                                //return;
                            }
                            value += dy_a;
                            if (value >= dx_a)
                            {
                                value -= dx_a;
                                y0 += sy;
                            }
                            x0 += sx;
                        }
                        else
                        {
                            if (y0 > y1)
                            {
                                console.log("ERR")
                                //return;
                            }
                            value += dx_a;
                            if (value >= dy_a)
                            {
                                value -= dy_a;
                                x0 += sx;
                            }
                            y0 += sy;
                        }
                    }
                }
            
                if (lines[i+1] == "")
                {
                    end_points[y][x] = 1;
                }
                else
                {
                    control_points[y][x] = 1;
                }
                paths_pixel_array[y][x] = 1;
            }
            else
            {
              start_points[y][x] = 1;
              paths_pixel_array[y][x] = 1;
              line_started = true;
            }
        
            prev_x = x;
            prev_y = y;
        }
        else
        {
            /*// change prev pixel to end pixel
            end_points[prev_y][prev_x] = 1;
            control_points[prev_y][prev_x] = 1;
            paths_pixel_array[prev_y][prev_x] = 1;*/
            line_started = false;
        }
    }
  
    expanded_paths_pixel_array = [];
    for (var y = 0; y < 196; y++)
    {
        expanded_paths_pixel_array[y] = [];
        for (var x = 0; x < 180; x++)
        {
            expanded_paths_pixel_array[y][x] = 0;
        }
    }

    
    // Expand the paths array into 4x4 pixels
    for (var y = 0; y < 196; y++)
    {
        for (var x = 0; x < 180; x++)
        {
            if (paths_pixel_array[y][x] == 1)
            {
                for (var i = 0; i < 4; i++)
                {
                    for (var j = 0; j < 4; j++)
                    {
                        expanded_paths_pixel_array[Math.max(y-i,0)][Math.min(x+j,179)] = 1;
                    }
                }
            }
        }
    }
    
    remaining_good_pixels = [];
    for (var y = 0; y < 196; y++)
    {
        remaining_good_pixels[y] = [];
        for (var x = 0; x < 180; x++)
        {
            remaining_good_pixels[y][x] = 0;
        }
    }
    
    // remove the expanded pixels from the good array, see what is left
    // do a modified min-cover
    for (var y = 0; y < 196; y++)
    {
        for (var x = 0; x < 180; x++)
        {
            if (good_pixel_array[y][x] == 1 && expanded_paths_pixel_array[y][x] == 0)
            {
                remaining_good_pixels[y][x] = 1;
            }
        }
    }
}

function draw_paths()
{
  var canvas = document.getElementById('small_coords_canvas');
  var ctx = canvas.getContext('2d');

  var first_pixel = ctx.createImageData(1, 1);
  first_pixel.data[0] = 0x00;
  first_pixel.data[1] = 0xFF;
  first_pixel.data[2] = 0x00;
  first_pixel.data[3] = 0xFF;

  var control_pixel = ctx.createImageData(1, 1);
  control_pixel.data[0] = 0xFF;
  control_pixel.data[1] = 0xFF;
  control_pixel.data[2] = 0x00;
  control_pixel.data[3] = 0xFF;
  
  var mid_pixel = ctx.createImageData(1, 1);
  mid_pixel.data[0] = 0x00;
  mid_pixel.data[1] = 0x00;
  mid_pixel.data[2] = 0xFF;
  mid_pixel.data[3] = 0xFF;
  
  var end_pixel = ctx.createImageData(1, 1);
  end_pixel.data[0] = 0xFF;
  end_pixel.data[1] = 0x00;
  end_pixel.data[2] = 0x00;
  end_pixel.data[3] = 0xFF;
  
  for (var y = 0; y < 196; y++)
  {
      for (var x = 0; x < 180; x++)
      {
          if (end_points[y][x] == 1)
          {
              ctx.putImageData(end_pixel, x, y);
          }
          else if (start_points[y][x] == 1)
          {
              ctx.putImageData(first_pixel, x, y);
          }
          else if (control_points[y][x] == 1)
          {
              ctx.putImageData(control_pixel, x, y);
          }
          else if (mid_points[y][x] == 1)
          {
              ctx.putImageData(mid_pixel, x, y);
          }
      }
  }
}

function copy_small_to_big()
{
  var small_canvas = document.getElementById('small_coords_canvas');

  png.src = small_canvas.toDataURL('image/png');
  
  var large_canvas = document.getElementById('coords_canvas');
  var ctx = large_canvas.getContext('2d');
  
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(png, 0, 0, 180*multiple, 196*multiple)
}

function copy_pixel_array(pixels, r, g, b, a)
{
  var canvas = document.getElementById('small_coords_canvas');
  var ctx = canvas.getContext('2d');

  var fill_pixel = ctx.createImageData(1, 1);
  fill_pixel.data[0] = r;
  fill_pixel.data[1] = g;
  fill_pixel.data[2] = b;
  fill_pixel.data[3] = a;
  
  for (var y = 0; y < 196; y++)
  {
    for (var x = 0; x < 180; x++)
    {
      if (pixels[y][x] == 1)
      {
        ctx.putImageData(fill_pixel, x, y);
      }
    }
  }
}

function clear_small_canvas()
{
  var canvas = document.getElementById('small_coords_canvas');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 180, 196);
}

function clear_large_canvas()
{
  var canvas = document.getElementById('coords_canvas');
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 180*11, 196*11);
}

function resize_grid_canvas()
{
    $("#coords_canvas").attr("width",180*multiple).attr("height",196*multiple);
}

function draw_grid()
{
    var canvas = document.getElementById('coords_canvas');
    var ctx = canvas.getContext('2d');

    ctx.strokeStyle = "#dedfde";
    for (var x = 0; x < 180-1; x++)
    {
      ctx.beginPath();
      ctx.moveTo((x+1)*multiple-.5,0);
      ctx.lineTo((x+1)*multiple-.5,196*multiple);
      ctx.stroke();
    }
    
    for (var y = 0; y < 196-1; y++)
    {
      ctx.beginPath();
      ctx.moveTo(0, (y+1)*multiple-.5);
      ctx.lineTo(180*multiple, (y+1)*multiple-.5);
      ctx.stroke();
    }
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
    y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
  };
}

var filename;        
var in_pixel_array = [];
var good_pixel_array = [];
var bad_pixel_array = [];
var draw_pixel_array = [];
var paths_pixel_array = [];
var expanded_paths_pixel_array = [];
var remaining_good_pixels = [];

for (var i = 0; i < 196; i++)
{
    in_pixel_array[i] = [];
    good_pixel_array[i] = [];
    bad_pixel_array[i] = [];
    draw_pixel_array[i] = [];
    paths_pixel_array[i] = [];
    expanded_paths_pixel_array[i] = [];
    remaining_good_pixels[i] = [];
    for (var j = 0; j < 180; j++)
    {
        in_pixel_array[i][j] = 0;
        good_pixel_array[i][j] = 0;
        bad_pixel_array[i][j] = 0;
        draw_pixel_array[i][j] = 0;
        paths_pixel_array[i][j] = 0;
        expanded_paths_pixel_array[i][j] = 0;
        remaining_good_pixels[i][j] = 0;
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

function dataURLToUint8Array(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);

        return raw;
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return uInt8Array;
}

function find_shapes(coordinates)
{
    var copy = [];
    for (var y = 0; y < 196; y++)
    {
        copy[y] = [];
        for (var x = 0; x < 180; x++)
        {
            copy[y][x] = coordinates[y][x];
        }
    }
    
    var result = [];
    
    var temp;
    while (temp = find_shape(copy))
    {
        result.push(temp);
        for (var y = 0; y < 196; y++)
        {
            for (var x = 0; x < 180; x++)
            {
                if (temp[y][x] == 1)
                {
                    copy[y][x] = 0;
                }
            }
        }
    }
  
    return result;
}

function find_shape(coordinates)
{
    var result = [];
    for (var y = 0; y < 196; y++)
    {
        result[y] = [];
        for (var x = 0; x < 180; x++)
        {
            result[y][x] = 0;
        }
    }
    
    var first_pixel = find_first_pixel(coordinates);
    if (!first_pixel)
    {
        return false;
    }
    
    result = flood_copy(result, coordinates, first_pixel.x, first_pixel.y);
    
    return result;
}

function flood_copy(to, from, x, y)
{
    if (x < 0 || x > 179 || y < 0 || y > 195)
    {
        return to;
    }
    if (from[y][x] != 1 || to[y][x] == 1)
    {
        return to;
    }
    
    to[y][x] = 1;
    to = flood_copy(to, from, x-1, y-1)
    to = flood_copy(to, from, x, y-1)
    to = flood_copy(to, from, x+1, y-1)
    to = flood_copy(to, from, x-1, y)
    
    to = flood_copy(to, from, x+1, y)
    to = flood_copy(to, from, x-1, y+1)
    to = flood_copy(to, from, x, y+1)
    to = flood_copy(to, from, x+1, y+1)
    
    return to;
}

function find_first_pixel(coordinates)
{
    for (var y = 0; y < 196; y++)
    {
        for (var x = 0; x < 180; x++)
        {
            if (coordinates[y][x] == 1)
            {
                return {x: x, y: y};
            }
        }
    }
    return false;
}

function getBlob(canvas)
{
    return dataURLToBlob(canvas.toDataURL("image/png"));
}

function SaveCoordsImage(coordinates, r, g, b, a) {
    var canvas = CoordsToCanvas(coordinates, r, g, b, a)

    var data = getBlob(canvas);
    
    downloadBlob(data, filename.substring(0,filename.length-4) + "_REGION.png")
}

function CoordsToCanvas(coordinates, r, g, b, a) {
    var canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 196;
    var ctx = canvas.getContext("2d");

    var fill_pixel = ctx.createImageData(1, 1);
    fill_pixel.data[0] = r;
    fill_pixel.data[1] = g;
    fill_pixel.data[2] = b;
    fill_pixel.data[3] = a;

    for (var y = 0; y < 196; y++)
    {
        for (var x = 0; x < 180; x++)
        {
            if (coordinates[y][x] == 1)
            {
                ctx.putImageData(fill_pixel, x, y);
            }
        }
    }
    
    return canvas;
}

function downloadBlob(blob, filename)
{
    var a = $("<a style=\"display: none\">This should never be seen</a>");

    a[0].download = filename;
    a[0].href = window.URL.createObjectURL(blob);
    a[0].textContent = 'Download ready';

    a[0].dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a[0].click();
}

function SaveShapes(shapes)
{
    var zip = new JSZip();
    
    for(var i in shapes) {
        var canvas = CoordsToCanvas(shapes[i], 0, 0, 0, 0xFF);
        zip.file(filename.substring(0,filename.length-4) + "_REGION_" + (parseInt(i)+1) + ".png",dataURLToUint8Array(canvas.toDataURL("image/png")));
    }
    
    console.log(zip.files)
    var content = zip.generate({type:"blob"});
    downloadBlob(content,filename.substring(0,filename.length-4) + "_SHAPES.zip");
}  

