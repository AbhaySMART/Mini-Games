from pathlib import Path

ROOT = Path("assets/lpc-generated/pets")


def rect(x, y, w, h, color, opacity=None):
    extra = "" if opacity is None else f' opacity="{opacity}"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"{extra}/>'


def svg(rects):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" shape-rendering="crispEdges">
{chr(10).join(rects)}
</svg>
'''


def write(name, rects):
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / f"{name}.svg").write_text(svg(rects))


def shadow():
    return [rect(18, 82, 60, 8, "#000000", ".16")]


def baby_dragon():
    r = [
        rect(18, 40, 12, 18, "#ffb703"), rect(66, 40, 12, 18, "#ffb703"),
        rect(24, 44, 46, 30, "#ff7b54"), rect(58, 34, 24, 20, "#ff7b54"),
        rect(62, 26, 6, 10, "#ffd166"), rect(76, 28, 6, 10, "#ffd166"),
        rect(76, 42, 10, 8, "#ff7b54"), rect(84, 46, 6, 6, "#ffb703"),
        rect(66, 40, 5, 5, "#1f1740"), rect(28, 56, 30, 10, "#ffb703"),
        rect(12, 56, 18, 10, "#ff7b54"), rect(8, 52, 8, 8, "#ffb703"),
        rect(30, 74, 10, 8, "#522b2b"), rect(56, 74, 10, 8, "#522b2b"),
        rect(30, 30, 12, 12, "#ffd166"), rect(42, 34, 8, 12, "#ffd166"),
    ]
    write("baby-dragon", r + shadow())


def lantern_fox():
    r = [
        rect(20, 42, 46, 28, "#ff9f1c"), rect(58, 32, 22, 22, "#ff9f1c"),
        rect(58, 22, 8, 14, "#ff9f1c"), rect(72, 22, 8, 14, "#ff9f1c"),
        rect(62, 28, 4, 6, "#fff2a8"), rect(74, 28, 4, 6, "#fff2a8"),
        rect(74, 44, 14, 8, "#fff2a8"), rect(66, 40, 5, 5, "#19133a"),
        rect(10, 48, 18, 16, "#ff9f1c"), rect(6, 52, 10, 10, "#fff2a8"),
        rect(24, 68, 8, 10, "#5b2e0d"), rect(52, 68, 8, 10, "#5b2e0d"),
        rect(18, 26, 18, 18, "#ffd166", ".55"), rect(22, 30, 10, 10, "#fff2a8"),
        rect(24, 24, 6, 6, "#7a4d00"),
    ]
    write("lantern-fox", r + shadow())


def crystal_turtle():
    r = [
        rect(18, 50, 48, 24, "#2ec4b6"), rect(28, 38, 36, 28, "#5fd3e8"),
        rect(34, 42, 10, 10, "#b8f7ff"), rect(48, 42, 10, 10, "#7bdff2"),
        rect(40, 54, 12, 8, "#3aa6b9"), rect(62, 50, 18, 16, "#95d5b2"),
        rect(70, 54, 5, 5, "#19133a"), rect(14, 58, 10, 10, "#95d5b2"),
        rect(22, 72, 10, 8, "#2d6a4f"), rect(56, 72, 10, 8, "#2d6a4f"),
        rect(36, 28, 8, 12, "#c7f9ff"), rect(48, 26, 8, 14, "#c7f9ff"),
        rect(58, 30, 8, 10, "#c7f9ff"),
    ]
    write("crystal-turtle", r + shadow())


def cloud_owl():
    r = [
        rect(28, 34, 38, 40, "#bfd7ea"), rect(22, 42, 12, 24, "#ffffff"),
        rect(60, 42, 12, 24, "#ffffff"), rect(26, 24, 12, 16, "#bfd7ea"),
        rect(56, 24, 12, 16, "#bfd7ea"), rect(34, 38, 10, 10, "#ffffff"),
        rect(50, 38, 10, 10, "#ffffff"), rect(38, 42, 4, 4, "#19133a"),
        rect(54, 42, 4, 4, "#19133a"), rect(46, 48, 6, 6, "#ffd166"),
        rect(34, 60, 26, 8, "#9fb8cc"), rect(18, 28, 16, 8, "#ffffff", ".78"),
        rect(62, 30, 16, 8, "#ffffff", ".78"), rect(38, 74, 8, 8, "#6b708d"),
        rect(50, 74, 8, 8, "#6b708d"),
    ]
    write("cloud-owl", r + shadow())


def firefly_bunny():
    r = [
        rect(34, 18, 8, 28, "#f7d6ff"), rect(54, 18, 8, 28, "#f7d6ff"),
        rect(36, 22, 4, 20, "#fff2a8"), rect(56, 22, 4, 20, "#fff2a8"),
        rect(28, 42, 40, 30, "#f7d6ff"), rect(62, 48, 12, 12, "#f7d6ff"),
        rect(36, 50, 5, 5, "#19133a"), rect(56, 50, 5, 5, "#19133a"),
        rect(46, 56, 4, 4, "#ff8fab"), rect(22, 58, 10, 10, "#f7d6ff"),
        rect(34, 72, 10, 8, "#9d7ac4"), rect(54, 72, 10, 8, "#9d7ac4"),
        rect(14, 32, 8, 8, "#fff2a8", ".85"), rect(18, 26, 4, 4, "#fff9c7"),
        rect(72, 34, 8, 8, "#fff2a8", ".85"), rect(78, 28, 4, 4, "#fff9c7"),
    ]
    write("firefly-bunny", r + shadow())


def main():
    baby_dragon()
    lantern_fox()
    crystal_turtle()
    cloud_owl()
    firefly_bunny()


if __name__ == "__main__":
    main()
