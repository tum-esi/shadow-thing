import os
import json
import subprocess
import time

with open("src/test-scripts/test.conf.json", encoding='utf-8-sig') as json_file:
    data = json.load(json_file)

if not os.path.exists('test_results'):
    os.mkdir('test_results')

if not os.path.exists('test_results/http'):
    os.mkdir('test_results/http')

if not os.path.exists('test_results/coap'):
    os.mkdir('test_results/coap')

if not os.path.exists('test_results/mqtt'):
    os.mkdir('test_results/mqtt')

if data['mode'] == 0:
    for protocol in data['protocol']:
        for nPort in range(data['ports']['start'], data['ports']['end']+1):
            for interval in range(data['interval']['start'], data['interval']['end'], data['interval']['step']):
                for nInstance in range(data['thingInstance']['start'], data['thingInstance']['end'], data['thingInstance']['step']):
                    server = subprocess.Popen(['node', '--max-old-space-size=6000', 'dist/test-scripts/single_thread.js', str(nPort), str(interval), str(nInstance), protocol, data['tdPath']])
                    counter = 0
                    while counter < 60:
                        print(f'Starting next test in {60-counter}')
                        counter += 1
                        time.sleep(1)
                    print(f'Starting test with {protocol} protocol, {nPort} ports, {nInstance} instances, with an interval of {interval}'); 
                    subprocess.run(['node', 'dist/test-scripts/test-client.js', protocol, data['tdPath'], str(data['nDataEntries']), str(nPort), str(nInstance), str(interval)])
                    print('Done.')
                    server.kill()

