// noprotect
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


function dataURLToBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1)
    {
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

function Vector2(x,y) {
    this.x = x;
    this.y = y;

    this.magnitude = Math.sqrt(x*x + y*y);
    this.theta = Math.atan2(y,x);
}

Vector2.equals = function(p1,p2) {
    return (p1.x === p2.x) && (p1.y === p2.y);
};

Vector2.fromDirection = function(d) {
    switch(d) {
        case 0:
            return new Vector2(0,-1);
        case 1:
            return new Vector2(1,0);
        case 2:
            return new Vector2(0,1);
        case 3:
            return new Vector2(-1,0);
        default:
            return undefined;
    }
};

Vector2.prototype.add = function(a,b) {
    if(typeof(b) === "undefined") { // Adding two vectors directly
        return new Vector2(this.x + a.x, this.y + a.y);
    } else { // Adding components
        return new Vector2(this.x + a, this.y + b);
    }
};

var Direction = {
    // Anticlockwise: turn left 90* if looking in this direction
    'left': function(d) {
        d--;
        if(d<0) return d+4;
        else return d;
    },
    
    // Clockwise: turn right 90* if looking in this direction
    'right': function(d) {
        d++;
        if(d>=4) return d-4;
        else return d;
    },
    
    'north': 0,
    'east': 1,
    'south': 2,
    'west': 3,
};

// Find the outline of a shape.  For each shape, it finds the convex hull of
// the contiguous black region containing the top-left-most black pixel
function findOutline(coordinates) {
    var result = [];

    var firstPos = getFirstPoint(coordinates);
    if(!firstPos) { return false; }
    
    var pos = firstPos.add(0,0);
    var dir = Direction.south;
    
    result.push(firstPos);
    
    do {
        result.push(pos);
        var adjs = getAdjacentPixels(coordinates, pos, dir);
        
        // Invariant: adjs[2] === 0 && adjs[3] === 1
        if(adjs[2] !== 0 || adjs[3] !== 1) {
            console.log("Invariant violated in findOutline");
        }
        
        // Adjacency ordering:
        // 0 1     ? ?
        // 3 2     # _
        
        if(adjs[0] === 1 && adjs[1] === 0) {
            // Continue straight
            pos = pos.add(Vector2.fromDirection(dir));
        } else if(adjs[0] === 1 && adjs[1] === 1) {
            pos = pos.add(Vector2.fromDirection(dir));
            result.push(pos);
            
            dir = Direction.right(dir);
            pos = pos.add(Vector2.fromDirection(dir));
        } else {
            // Using the 'left' turn policy for _ #;
            // turning as normal for _ _.
            dir = Direction.left(dir);
            
        }
        
        
    } while (!Vector2.equals(firstPos,pos));
    
    return result;
}

function getAllPoints(coordinates) {
    var result = [];
    for(y = 0; y < 196; y++) {
        for(x = 0; x < 180; x++) {
            if(coordinates[y][x] === 1) result.push(new Vector2(x,y));
        }
    }

    return result;
}

function getFirstPoint(coordinates) {
    for(y = 0; y < 196; y++) {
        for(x = 0; x < 180; x++) {
            if(coordinates[y][x] === 1) return new Vector2(x,y);
        }
    }

    return false;
}

// Gets the adjacent pixels in clockwise order oriented correctly for
// potrace path extension, ordered such that the current pixel is always last
function getAdjacentPixels(coordinates, p, dir) {
    // These coordinates are in the expected order if dir === north.
    // We need to rotate them by one for every step in direction if
    // direction is anything else to orient them such that the current
    // pixel is the bottom left, and the adjacent white pixel is to its right
    
    var result;
    
    if (dir == Direction.north)
    {
        if (p.y == 0)
        {
            result = [0,                         0,
                      coordinates[p.y][p.x+1],   coordinates[p.y][p.x]];        
        }
        else
        {
            result = [coordinates[p.y-1][p.x],   coordinates[p.y-1][p.x+1],
                      coordinates[p.y][p.x+1],   coordinates[p.y][p.x]];
        }
    }
    else if (dir == Direction.east)
    {
        if (p.y == 195)
        {
            result = [coordinates[p.y][p.x+1],   0,
                      0,                         coordinates[p.y][p.x]];
        }
        else
        {
            result = [coordinates[p.y][p.x+1],   coordinates[p.y+1][p.x+1],
                      coordinates[p.y+1][p.x],   coordinates[p.y][p.x]];
        }
    }
    else if (dir == Direction.south)
    {
        if (p.y == 195)
        {
            result = [0,                         0,
                      coordinates[p.y][p.x-1],   coordinates[p.y][p.x]];
        }
        else
        {
            result = [coordinates[p.y+1][p.x],   coordinates[p.y+1][p.x-1],
                      coordinates[p.y][p.x-1],   coordinates[p.y][p.x]];
        }
    }
    else
    {
        if (p.y == 0)
        {
            result = [coordinates[p.y][p.x-1],   0,
                      0,                         coordinates[p.y][p.x]];
        }
        else
        {
            result = [coordinates[p.y][p.x-1],   coordinates[p.y-1][p.x-1],
                      coordinates[p.y-1][p.x],    coordinates[p.y][p.x]];
        }
    }
    
    for (var i = 0; i < 4; i++)
    {
        if (result[i] === undefined)
        {
            result[i] = 0;
        }
    }
    
    return result;
}

function SavePointsImage(points) {
    var canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 196;
    var ctx = canvas.getContext("2d");

    var fill_pixel = ctx.createImageData(1, 1);
    fill_pixel.data[0] = 0x00;
    fill_pixel.data[1] = 0x00;
    fill_pixel.data[2] = 0xFF;
    fill_pixel.data[3] = 0xFF;

    for(var p in points) {
        ctx.putImageData(fill_pixel, points[p].x, points[p].y);
    }

    var data = dataURLToBlob(canvas.toDataURL("image/png"));

    var a = $("<a style=\"display: none\">This should never be seen</a>");

    a[0].download = filename.substring(0,filename.length-4) + "_REGION.png";
    a[0].href = window.URL.createObjectURL(data);
    a[0].textContent = 'Download ready';

    a[0].dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
    a[0].click();
}

function min_cover(pixels)
{
    // Copy our working set
    // Make a resultset
    var pixel_copy = [];
    var result = [];
    for (var i = 0; i < 196; i++)
    {
        pixel_copy[i] = [];
        result[i] = [];
        for (var j = 0; j < 180; j++)
        {
            pixel_copy[i][j] = pixels[i][j];
            result[i][j] = 0;
        }
    }
    
    var point_count = 0;
  
    // Start in the lower left corner
    // Find the first black pixel in our working set
    // Check right and up in the original copy, see if we need to move backwards 
    for (var y = 195; y >= 0; y--)
    {
        for (var x = 0; x < 180; x++)
        {
            if (pixel_copy[y][x] == 1)
            {
                // We found the first set pixel
                var best_x_offset = 3;
                var best_y_offset = 3;
                var best_new_count = 0;
                            
                // Try all 16 positions that would cover this pixel
                for (var i = 0; i < 4; i++)
                {
                    for (var j = 0; j < 4; j++)
                    {
                        var x_offset = -j;
                        var y_offset = i;
                        
                        var cur_x = x + x_offset;
                        var cur_y = y + y_offset;
                        
                        // Make sure this new position is valid (not off screen)
                        if (cur_x >= 0 && cur_x <= 180-4 && cur_y >= 3 && cur_y < 196)
                        {
                            var sum_new = 0;
                            var sum_old = 0;
                            
                            // Check all 16 pixels at this new position
                            for (var k = 0; k < 4; k++)
                            {
                                for (var h = 0; h < 4; h++)
                                {
                                    sum_new += pixel_copy[cur_y-k][cur_x+h];
                                    sum_old += pixels[cur_y-k][cur_x+h];
                                }
                            }
                            
                            // Make sure we didn't hit a blank pixel in the original copy
                            if (sum_old == 16)
                            {
                                // See if this position is better than our best so far
                                if (sum_new > best_new_count)
                                {
                                    var best_x_y = (3-best_x_offset) + (3-best_y_offset);
                                    var cur_x_y = (3-i) + (3-j);
                                    
                                    if (cur_x_y > best_x_y)
                                    {
                                        best_new_count = sum_new;
                                        best_x_offset = j;
                                        best_y_offset = i;
                                    }
                                }
                            }
                        }
                    }
                }
                
                var x_offset = -best_x_offset;
                var y_offset = best_y_offset;
                                
                
                // With the offsets, make sure all pixels are black
                if (pixels[y+y_offset][x+x_offset] == 1   && pixels[y+y_offset][x+x_offset+1] == 1   && pixels[y+y_offset][x+x_offset+2] == 1   && pixels[y+y_offset][x+x_offset+3] == 1 &&
                    pixels[y+y_offset-1][x+x_offset] == 1 && pixels[y+y_offset-1][x+x_offset+1] == 1 && pixels[y+y_offset-1][x+x_offset+2] == 1 && pixels[y+y_offset-1][x+x_offset+3] == 1 &&
                    pixels[y+y_offset-2][x+x_offset] == 1 && pixels[y+y_offset-2][x+x_offset+1] == 1 && pixels[y+y_offset-2][x+x_offset+2] == 1 && pixels[y+y_offset-2][x+x_offset+3] == 1 &&
                    pixels[y+y_offset-3][x+x_offset] == 1 && pixels[y+y_offset-3][x+x_offset+1] == 1 && pixels[y+y_offset-3][x+x_offset+2] == 1 && pixels[y+y_offset-3][x+x_offset+3] == 1)
                {
                    // Turn these pixels off in the working set
                    for (var i = 0; i < 4; i++)
                    {
                        for (var j = 0; j < 4; j++)
                        {
                            pixel_copy[y+y_offset-i][x+x_offset+j] = 0;
                        }
                    }
                    result[y+y_offset][x+x_offset] = 1;
                    point_count++;
                }
                else
                {
                    console.log("this shouldn't happen");
                }
            }
        }
    }
    console.log("Points needed: " + point_count)
    
    return result;
}