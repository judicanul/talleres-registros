import zlib
import struct
import math
import os

def create_car_png(width=400, height=800, output_path="public/car-silhouette.png"):
    # 4 channels: RGBA
    img = bytearray([0] * (width * height * 4))

    def set_pixel(x, y, r, g, b, a=255):
        if 0 <= x < width and 0 <= y < height:
            idx = (y * width + x) * 4
            img[idx] = r
            img[idx+1] = g
            img[idx+2] = b
            img[idx+3] = a

    def fill_rect(x1, y1, x2, y2, r, g, b, a=255):
        for y in range(max(0, y1), min(height, y2)):
            for x in range(max(0, x1), min(width, x2)):
                set_pixel(x, y, r, g, b, a)

    def draw_rounded_box(cx, cy, w, h, radius, r, g, b, a=255, fill_r=None, fill_g=None, fill_b=None, fill_a=None):
        x1 = cx - w // 2
        x2 = cx + w // 2
        y1 = cy - h // 2
        y2 = cy + h // 2
        for y in range(max(0, y1), min(height, y2)):
            for x in range(max(0, x1), min(width, x2)):
                # Corner checks
                dx = 0
                if x < x1 + radius:
                    dx = (x1 + radius) - x
                elif x > x2 - radius:
                    dx = x - (x2 - radius)
                
                dy = 0
                if y < y1 + radius:
                    dy = (y1 + radius) - y
                elif y > y2 - radius:
                    dy = y - (y2 - radius)
                
                dist_sq = dx*dx + dy*dy
                rad_sq = radius * radius

                if dist_sq <= rad_sq:
                    # check if border or fill
                    is_border = (dx > 0 or dy > 0) and dist_sq > (radius - 3)**2
                    if is_border:
                        set_pixel(x, y, r, g, b, a)
                    elif fill_r is not None:
                        set_pixel(x, y, fill_r, fill_g, fill_b, fill_a)
                elif dx == 0 or dy == 0:
                    # Inside flat region
                    if (x <= x1 + 3 or x >= x2 - 4 or y <= y1 + 3 or y >= y2 - 4):
                        set_pixel(x, y, r, g, b, a)
                    elif fill_r is not None:
                        set_pixel(x, y, fill_r, fill_g, fill_b, fill_a)

    # 1. Wheels (4 tires)
    wheel_w = 34
    wheel_h = 75
    wheel_color = (30, 41, 59, 255) # slate-800
    # Front-left, front-right, rear-left, rear-right
    fill_rect(48, 160, 48 + wheel_w, 160 + wheel_h, *wheel_color)
    fill_rect(width - 48 - wheel_w, 160, width - 48, 160 + wheel_h, *wheel_color)
    fill_rect(48, 560, 48 + wheel_w, 560 + wheel_h, *wheel_color)
    fill_rect(width - 48 - wheel_w, 560, width - 48, 560 + wheel_h, *wheel_color)

    # 2. Side Mirrors
    mirror_w = 26
    mirror_h = 42
    fill_rect(42, 260, 42 + mirror_w, 260 + mirror_h, 71, 85, 105, 255)
    fill_rect(width - 42 - mirror_w, 260, width - 42, 260 + mirror_h, 71, 85, 105, 255)

    # 3. Main Car Body (Chassis)
    # Center is (200, 400), width ~ 240, height ~ 680
    draw_rounded_box(200, 400, 240, 680, 50, 51, 65, 85, 255, 226, 232, 240, 255)

    # 4. Front Hood & Bumper Line
    draw_rounded_box(200, 200, 200, 200, 30, 148, 163, 184, 255, 203, 213, 225, 255)

    # 5. Windshield (Front)
    # Curved trapezoid-like rounded box
    draw_rounded_box(200, 280, 180, 70, 16, 30, 41, 59, 255, 71, 85, 105, 255)

    # 6. Roof (Cabin)
    draw_rounded_box(200, 400, 170, 150, 20, 148, 163, 184, 255, 241, 245, 249, 255)

    # 7. Rear Windshield
    draw_rounded_box(200, 505, 174, 55, 14, 30, 41, 59, 255, 71, 85, 105, 255)

    # 8. Rear Trunk / Bumper Line
    draw_rounded_box(200, 620, 190, 130, 25, 148, 163, 184, 255, 203, 213, 225, 255)

    # 9. Headlights (Front left & right)
    draw_rounded_box(120, 95, 36, 18, 8, 245, 158, 11, 255, 254, 240, 138, 255)
    draw_rounded_box(280, 95, 36, 18, 8, 245, 158, 11, 255, 254, 240, 138, 255)

    # 10. Taillights (Rear left & right)
    draw_rounded_box(120, 705, 38, 16, 6, 185, 28, 28, 255, 239, 68, 68, 255)
    draw_rounded_box(280, 705, 38, 16, 6, 185, 28, 28, 255, 239, 68, 68, 255)

    # Write PNG
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        start = y * width * 4
        raw_data.extend(img[start:start + width * 4])

    compressed = zlib.compress(bytes(raw_data), 9)

    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    # IHDR: width, height, 8-bit depth, RGBA (6), compression 0, filter 0, interlace 0
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b"IHDR", ihdr_data))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(png)
    print(f"Generated {output_path} ({len(png)} bytes)")

if __name__ == "__main__":
    create_car_png()
