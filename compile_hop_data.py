import os, json, glob, re

fnames = glob.glob('hop_data/*.json')

json_out = []

for fname in fnames:
    if 'all_hop_data' in fname:
        continue

    hop = re.search('/(.*).json', fname).groups()[0]
    with open(fname) as f:
        data = json.load(f)
    out = {'hop': hop,
           'data': data}
    json_out.append(out)

with open('hop_data/all_hop_data.json', 'w') as f:
    json.dump(json_out, f)
