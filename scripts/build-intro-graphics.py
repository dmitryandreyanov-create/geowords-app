"""Deterministic, unlabelled editorial draft diagrams; never edits source maps."""
from pathlib import Path
import math
import subprocess

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/graphics'
DEST.mkdir(parents=True, exist_ok=True)

def render(name, content):
    svg = DEST / (name + '.svg')
    svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#f8f4e9"/>' + content + '</svg>')
    subprocess.run(['inkscape', str(svg), '--export-type=png', '--export-filename=' + str(DEST / (name + '.original.png'))], check=True, capture_output=True)

# Existing base frame documented in data/maps/world-mountains.json.
# Miller cylindrical: 168W..192E, 72S..82N. North is up.
def miller(latitude):
    return 1.25 * math.log(math.tan(math.pi / 4 + math.radians(latitude) * .4))

x, y, w = 100, 150, 1400
h = w * 1211 / 2200
equator = y + h * miller(82) / (miller(82) - miller(-72))
prime = x + w * 168 / 360
render('intro-continents-oceans', f'''
<image x="{x}" y="{y}" width="{w}" height="{h}" xlink:href="../world-base.webp"/>
<path d="M{x} {equator}H{x+w}" stroke="#c16c35" stroke-width="7" stroke-dasharray="22 13"/>
<path d="M{prime} {y}V{y+h}" stroke="#285f62" stroke-width="7" stroke-dasharray="22 13"/>
<path d="M800 128V48M778 72L800 48L822 72" fill="none" stroke="#285f62" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
''')

# Conceptual coast: large partially enclosed sea opens east into the ocean;
# smaller rounded inlet extends west into land. No real-world place is asserted.
render('intro-seas', '''
<rect x="80" y="80" width="1440" height="840" rx="48" fill="#8fc5c5"/>
<path d="M80 80H1520V225C1300 248 1100 148 917 225C760 290 775 365 660 385C565 401 526 338 435 371C343 405 366 524 452 547C523 565 569 506 657 535C781 576 738 704 940 757C1130 807 1290 740 1520 790V920H80Z" fill="#dfc68f" stroke="#776b4f" stroke-width="6"/>
<path d="M1190 360Q1250 340 1310 360M1225 420Q1285 400 1345 420M960 530Q1020 510 1080 530" fill="none" stroke="#619d9f" stroke-width="8" stroke-linecap="round"/>
''')

# Left: natural curved strait between separate land masses, joining two seas.
# Right: straight artificial canal through a continuous strip of land.
render('intro-straits', '''
<rect x="70" y="90" width="700" height="820" rx="40" fill="#8fc5c5"/>
<rect x="830" y="90" width="700" height="820" rx="40" fill="#8fc5c5"/>
<path d="M70 305C195 280 345 345 378 445C405 535 330 585 355 665C250 733 150 709 70 690Z" fill="#dfc68f" stroke="#776b4f" stroke-width="6"/>
<path d="M770 305C640 275 488 350 461 439C437 527 506 591 466 670C571 727 687 711 770 690Z" fill="#dfc68f" stroke="#776b4f" stroke-width="6"/>
<path d="M830 340Q1000 300 1150 340V660Q1000 700 830 660Z M1530 340Q1360 300 1210 340V660Q1360 700 1530 660Z" fill="#dfc68f" stroke="#776b4f" stroke-width="6"/>
<path d="M1150 340V660M1210 340V660" fill="none" stroke="#b1996c" stroke-width="12"/>
''')
print('Built 3 source SVG diagrams and original PNGs; import them as editorial drafts.')
