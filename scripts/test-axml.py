import struct
import hashlib
import zlib

def build_string_pool_utf16(strings):
    """Builds an Android AXML string pool chunk (UTF-16)."""
    offsets = []
    data = bytearray()
    
    for s in strings:
        offsets.append(len(data))
        # UTF-16 length is 2 bytes (number of 16-bit code units)
        u16 = s.encode('utf-16le')
        data += struct.pack('<H', len(s))
        data += u16
        data += b'\x00\x00' # 2-byte null terminator
    
    # 4-byte align data
    while len(data) % 4 != 0:
        data += b'\x00'
    
    chunk_type = 0x001c0001
    string_count = len(strings)
    style_count = 0
    flags = 0 # UTF-16
    header_size = 28
    strings_start = header_size + (string_count * 4)
    styles_start = 0
    chunk_size = strings_start + len(data)
    
    chunk = struct.pack('<IIIIIII', chunk_type, chunk_size, string_count, style_count, flags, strings_start, styles_start)
    for off in offsets:
        chunk += struct.pack('<I', off)
    chunk += data
    return chunk

print("String pool builder defined")
