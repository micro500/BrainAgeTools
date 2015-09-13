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
      copy_draw_pixels();
    });
    
    $("#coords_canvas").click(function(event) {
      var multiple = parseInt($("#multiple").val())
      var canvas = $("#coords_canvas")[0];
      var mousePos = getMousePos(canvas, event);
      $("#coords_textbox").val($("#coords_textbox").val() + (Math.floor(mousePos.x/multiple)) + "," + (Math.floor(mousePos.y/multiple)) + "\n");
      process_coords_list()
    });
});

function process_coords_list()
{
  copy_draw_pixels();
  
  var canvas = document.getElementById('coords_canvas');
  var ctx = canvas.getContext('2d');

  var multiple = parseInt($("#multiple").val());
  var pixel_size = multiple-1

  var first_pixel = ctx.createImageData(pixel_size, pixel_size);
  for (var i = 0; i < pixel_size*pixel_size; i++)
  {
    first_pixel.data[i*4] = 0x00;
    first_pixel.data[i*4+1] = 0xFF;
    first_pixel.data[i*4+2] = 0x00;
    first_pixel.data[i*4+3] = 0xFF;
  }
  var control_pixel = ctx.createImageData(pixel_size, pixel_size);
  for (var i = 0; i < pixel_size*pixel_size; i++)
  {
    control_pixel.data[i*4] = 0xFF;
    control_pixel.data[i*4+1] = 0xFF;
    control_pixel.data[i*4+2] = 0x00;
    control_pixel.data[i*4+3] = 0xFF;
  }
  var mid_pixel = ctx.createImageData(pixel_size, pixel_size);
  for (var i = 0; i < pixel_size*pixel_size; i++)
  {
    mid_pixel.data[i*4] = 0x00;
    mid_pixel.data[i*4+1] = 0x00;
    mid_pixel.data[i*4+2] = 0xFF;
    mid_pixel.data[i*4+3] = 0xFF;
  }
  var end_pixel = ctx.createImageData(pixel_size, pixel_size);
  for (var i = 0; i < pixel_size*pixel_size; i++)
  {
    end_pixel.data[i*4] = 0xFF;
    end_pixel.data[i*4+1] = 0x00;
    end_pixel.data[i*4+2] = 0x00;
    end_pixel.data[i*4+3] = 0xFF;
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
                ctx.putImageData(mid_pixel, x*multiple, new_y*multiple);
              }
            }
            else
            {
              // up
              for (var new_y = y + 1; new_y < prev_y; new_y++)
              {
                ctx.putImageData(mid_pixel, x*multiple, new_y*multiple);
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
                ctx.putImageData(mid_pixel, new_x*multiple, y*multiple);
              }
            }
            else
            {
              // up
              for (var new_x = x + 1; new_x < prev_x; new_x++)
              {
                ctx.putImageData(mid_pixel, new_x*multiple, y*multiple);
              }
            }
          }
        }
        else if (Math.abs(dist_x) == Math.abs(dist_y))
        {
          // diagonal
          if (Math.abs(dist_x) > 1)
          {
            // UL -> DR
            if (dist_x > 0 && dist_y > 0)
            {
              for (var offset = 1; offset < Math.abs(dist_x); offset++)
              {
                ctx.putImageData(mid_pixel, (prev_x+offset)*multiple, (prev_y+offset)*multiple);
              }
            }
            // DR -> UL
            else if (dist_x < 0 && dist_y < 0)
            {
              for (var offset = 1; offset < Math.abs(dist_x); offset++)
              {
                ctx.putImageData(mid_pixel, (prev_x-offset)*multiple, (prev_y-offset)*multiple);
              }
            }
            // DL -> UR
            else if (dist_x > 0 && dist_y < 0)
            {
              for (var offset = 1; offset < Math.abs(dist_x); offset++)
              {
                ctx.putImageData(mid_pixel, (prev_x+offset)*multiple, (prev_y-offset)*multiple);
              }
            }
            // UR -> DL
            else if (dist_x < 0 && dist_y > 0)
            {
              for (var offset = 1; offset < Math.abs(dist_x); offset++)
              {
                ctx.putImageData(mid_pixel, (prev_x-offset)*multiple, (prev_y+offset)*multiple);
              }
            }
          }
        }
        else
        {
          // illegal
          console.log("illegal coord: (" + x + "," + y + ") " + dist_x + " " + dist_y)
        }

        ctx.putImageData(control_pixel, x*multiple, y*multiple);
      }
      else
      {
        ctx.putImageData(first_pixel, x*multiple, y*multiple);
        line_started = true;
      }
      
      prev_x = x;
      prev_y = y;
    }
    else
    {
        // change prev pixel to end pixel
        ctx.putImageData(end_pixel, prev_x*multiple, prev_y*multiple);
        line_started = false;
    }
  }
}

function copy_draw_pixels()
{
  var canvas = document.getElementById('coords_canvas');
  var ctx = canvas.getContext('2d');

  resize_grid_canvas()
  var multiple = parseInt($("#multiple").val());

  var fill_pixel = ctx.createImageData(multiple, multiple);
  for (var i = 0; i < multiple*multiple; i++)
  {
    fill_pixel.data[i*4] = 0x00;
    fill_pixel.data[i*4+1] = 0x00;
    fill_pixel.data[i*4+2] = 0x00;
    fill_pixel.data[i*4+3] = 0xFF;
  }
  
  for (var y = 0; y < 196; y++)
  {
    for (var x = 0; x < 180; x++)
    {
      if (draw_pixel_array[y][x] == 1)
      {
        ctx.putImageData(fill_pixel, x*multiple, y*multiple);
      }
    }
  }
  
  draw_grid()

}

function resize_grid_canvas()
{
    var multiple = parseInt($("#multiple").val());
    $("#coords_canvas").attr("width",180*multiple).attr("height",196*multiple);
}

function draw_grid()
{
    var multiple = parseInt($("#multiple").val());
    var canvas = document.getElementById('coords_canvas');
    var ctx = canvas.getContext('2d');

    ctx.strokeStyle = "#dedfde";
    for (var x = 0; x < 180; x++)
    {
      ctx.beginPath();
      ctx.moveTo((x+1)*multiple-.5,0);
      ctx.lineTo((x+1)*multiple-1,196*multiple);
      ctx.stroke();
    }
    
    for (var y = 0; y < 196; y++)
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

