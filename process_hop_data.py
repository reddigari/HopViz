import sys, os, json
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

alt_columns = []
for col in columns:
    if ('aroma' in col or 'flavor' in col) and ('other' not in col):
        alt_columns.append('any_col')
    alt_columns.append(col)

hop_names = sys.argv[1:]

for hop_name in hop_names:
    csv_fname = 'raw_csv/%s.csv' %hop_name
    if not os.path.exists(csv_fname):
        print "Could not find '%s'. Not processing that file." %csv_fname
        continue

    json_fname = 'hop_data/%s.json' %hop_name

    d = pd.read_csv(csv_fname)
    d.fillna(0, inplace=True)

    if 'name' not in d.columns[1]:
        d.insert(1, 'name', 'name')

    print "%s:\t%d ratings" %(hop_name, d.shape[0])

    if d.columns.shape[0] == len(columns):
        d.columns = columns
    elif d.columns.shape[0] == len(alt_columns):
        d.columns = alt_columns
    else:
        raise RuntimeError("The number of columns in the csv is not recognized as one of the usual patterns.")

    json_out = []

    for dim in dimensions:
        out = dict(aroma=[], flavor=[])
        out['dimension'] = dim
        for percept in ['aroma', 'flavor']:
            vals = pd.to_numeric(d['%s_%s' %(dim, percept)], errors='coerce').values
            vals = [i for i in vals if i is not None and i < 10.0 and i >= 0.]
            out[percept] = vals
        json_out.append(out)

    with open(json_fname, 'w') as f:
        json.dump(json_out, f)
