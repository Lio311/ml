with open('app/admin/banner/BannerClient.js', 'r', encoding='utf-8') as f:
    content = f.read()

nl = '\n'
s44 = ' ' * 44  # 44 spaces
s48 = ' ' * 48  # 48 spaces
s52 = ' ' * 52  # 52 spaces
s56 = ' ' * 56  # 56 spaces
s60 = ' ' * 60  # 60 spaces
s40 = ' ' * 40  # 40 spaces
s36 = ' ' * 36  # 36 spaces
s32 = ' ' * 32  # 32 spaces

color_pickers = (
    nl + s44 + "{/* Button Colors */}" + nl
    + s44 + "<div className=\"grid grid-cols-2 gap-4 mt-3\">" + nl
    + s48 + "<div>" + nl
    + s52 + "<label className=\"block text-sm font-semibold text-gray-700 mb-2\">\u05e6\u05d1\u05e2 \u05d8\u05e7\u05e1\u05d8 \u05db\u05e4\u05ea\u05d5\u05e8</label>" + nl
    + s52 + "<div className=\"flex items-center gap-2\">" + nl
    + s56 + "<input" + nl
    + s60 + "type=\"color\"" + nl
    + s60 + "value={banner.btnTextColor || '#000000'}" + nl
    + s60 + "onChange={(e) => updateBanner(index, 'btnTextColor', e.target.value)}" + nl
    + s60 + "className=\"h-10 w-12 cursor-pointer rounded border border-gray-300 p-0.5\"" + nl
    + s56 + "/>" + nl
    + s56 + "<span className=\"text-xs text-gray-500 font-mono\">{banner.btnTextColor || '#000000'}</span>" + nl
    + s52 + "</div>" + nl
    + s48 + "</div>" + nl
    + s48 + "<div>" + nl
    + s52 + "<label className=\"block text-sm font-semibold text-gray-700 mb-2\">\u05e6\u05d1\u05e2 \u05de\u05e1\u05d2\u05e8\u05ea \u05db\u05e4\u05ea\u05d5\u05e8</label>" + nl
    + s52 + "<div className=\"flex items-center gap-2\">" + nl
    + s56 + "<input" + nl
    + s60 + "type=\"color\"" + nl
    + s60 + "value={banner.btnBorderColor || '#000000'}" + nl
    + s60 + "onChange={(e) => updateBanner(index, 'btnBorderColor', e.target.value)}" + nl
    + s60 + "className=\"h-10 w-12 cursor-pointer rounded border border-gray-300 p-0.5\"" + nl
    + s56 + "/>" + nl
    + s56 + "<span className=\"text-xs text-gray-500 font-mono\">{banner.btnBorderColor || '#000000'}</span>" + nl
    + s52 + "</div>" + nl
    + s48 + "</div>" + nl
    + s44 + "</div>" + nl
)

old = (
    s44 + "</div>" + nl
    + s40 + "</div>" + nl
    + s36 + "</div>" + nl
    + s32 + ")}"
)

new = (
    s44 + "</div>"
    + color_pickers
    + s40 + "</div>" + nl
    + s36 + "</div>" + nl
    + s32 + ")}"
)

if old in content:
    content = content.replace(old, new, 1)
    with open('app/admin/banner/BannerClient.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('NOT FOUND')
    # Find and show closing pattern
    idx = content.find(s44 + '</div>')
    if idx >= 0:
        print(repr(content[idx:idx+200]))
    else:
        print('Cannot find 44-space closing div')
