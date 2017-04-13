import json
import pandas as pd

dimensions = ['CITRUS', 'TROPICAL FRUIT', 'STONE FRUIT', 'APPLE-PEAR', 'MELON',\
              'BERRY', 'FLORAL', 'SPICY-HERBAL', 'PINE', 'RESINOUS', 'GRASSY',\
              'EARTHY-WOODY', 'ONION-GARLIC', 'DANK-CATTY']

columns = ['timestamp', 'name', 'CITRUS_aroma', 'TROPICAL FRUIT_aroma',\
           'STONE FRUIT_aroma', 'APPLE-PEAR_aroma', 'MELON_aroma', 'BERRY_aroma',\
           'FLORAL_aroma', 'SPICY-HERBAL_aroma', 'PINE_aroma', 'RESINOUS_aroma',\
           'GRASSY_aroma', 'EARTHY-WOODY_aroma', 'ONION-GARLIC_aroma',\
           'DANK-CATTY_aroma', 'other_aroma', 'CITRUS_flavor', 'TROPICAL FRUIT_flavor',\
           'STONE FRUIT_flavor', 'APPLE-PEAR_flavor', 'MELON_flavor', 'BERRY_flavor',\
           'FLORAL_flavor', 'SPICY-HERBAL_flavor', 'PINE_flavor', 'RESINOUS_flavor',\
           'GRASSY_flavor', 'EARTHY-WOODY_flavor', 'ONION-GARLIC_flavor',\
           'DANK-CATTY_flavor', 'other_flavor', 'strength', 'style', 'enjoyment']

hop_name = 'huell-melon'
csv_fname = 'raw_csv/%s.csv' %hop_name
json_fname = 'hop_data/%s.json' %hop_name

d = pd.read_csv(csv_fname)
d.columns = columns

json_out = []

for dim in dimensions:
    out = dict(aroma=[], flavor=[])
    out['dimension'] = dim
    for percept in ['aroma', 'flavor']:
        vals = pd.to_numeric(d['%s_%s' %(dim, percept)], errors='coerce').values
        vals = [i for i in vals if i is not None and i < 10.0]
        out[percept] = vals
    json_out.append(out)

with open(json_fname, 'w') as f:
    json.dump(json_out, f)
