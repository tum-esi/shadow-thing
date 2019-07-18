import os
import json
import subprocess

with open("src/test-scripts/test.conf.json", encoding='utf-8-sig') as json_file:
    data = json.load(json_file)

if not os.path.exists('test_results'):
    os.mkdir('test_results')

if not os.path.exists('test_results/single-thread'):
    os.mkdir('test_results/single-thread')

if not os.path.exists('test_results/single-thread/http'):
    os.mkdir('test_results/single-thread/http')

if not os.path.exists('test_results/single-thread/coap'):
    os.mkdir('test_results/single-thread/coap')

if not os.path.exists('test_results/single-thread/mqtt'):
    os.mkdir('test_results/single-thread/mqtt')

if not os.path.exists('test_results/multi-thread'):
    os.mkdir('test_results/multi-thread')

if not os.path.exists('test_results/multi-thread/http'):
    os.mkdir('test_results/multi-thread/http')

if not os.path.exists('test_results/multi-thread/coap'):
    os.mkdir('test_results/multi-thread/coap')

if not os.path.exists('test_results/multi-thread/mqtt'):
    os.mkdir('test_results/multi-thread/mqtt')

for mode in data['mode']:
    print('Starting single thread test...');
    for protocol in data['protocol']:
        for nPort in range(data['ports']['start'], data['ports']['end']+1):
            for interval in range(data['interval']['start'], data['interval']['end']+1, data['interval']['step']):
                for nInstancePerPort in range(data['thingInstance']['start'], data['thingInstance']['end']+1, data['thingInstance']['step']):
                    nMeasures = data['nDataEntries']
                    tdPath = data['tdPath']                    
                    print(f'Starting test with {protocol} protocol, {nPort} ports, {nInstancePerPort*nPort} instances, with an interval of {interval}'); 
                    subprocess.run(['node', '--max-old-space-size=6000', 'dist/test-scripts/benchmark_test.js', f'{nPort}', f'{interval}', \
                            f'{nInstancePerPort}', f'{nMeasures}', f'{mode}', f'{protocol}', f'{tdPath}'])
                    print('Done.')

