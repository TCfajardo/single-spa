#!/usr/bin/env node

const prompts = require('prompts');
prompts.override(require('yargs').argv);

const {spawn} = require('node:child_process');

const apps = {
    clients: 9001,
    invoices: 9002,
    menu: 9003,
    products: 9004,
};

(async () => {
    const {appSeleccionadas} = await prompts([
        {
            type: 'multiselect',
            name: 'appSeleccionadas',
            message: 'Seleccionar las aplicaciones a trabajar',
            instructions: false,
            choices: Object.entries(apps).map(([appName, portNumber])=>({
                title: `${appName} (Puerto: ${portNumber})`,
                value: appName,
            })),
            hint: '- Seleccionar con barra espaciadora y enter',
        }
    ]);
    console.log("--------log : ", appSeleccionadas);

    if (Array.isArray(appSeleccionadas) && appSeleccionadas.length <=0){
        console.log('Debe seleccionar por lo menos una aplicación');
        process.exit();
    }

    const iniciarProceso = spawn(
        /^win/.test(process.platform) ? 'lerna.cmd' : 'lerna',
        [
            "run",
            "start",
            "--scope",
            "*/*{root-config,styleguide,${appSeleccionadas.join(",")}}*",
            "--stream",
            "--parallel",
        ],
        {
            stdio: "inherit",
            env: {
                ...process.env,
                FEATURE_APP_DATA: JSON.stringify(
                    appSeleccionadas.reduce((result, currFeatureApp) => {
                        result[currFeatureApp] = apps[currFeatureApp];
                        return result;
                    }, {})
                )
            }
        }
    );
    
    iniciarProceso.on('error', (err) => {
        console.error("Error al iniciar proceso:", err); 
    });
    
    iniciarProceso.stdout.on('data', (data) => {
        console.log("stdout:", data.toString());
    });
    
    iniciarProceso.stderr.on('data', (data) => {
        console.error("stderr:", data.toString());
    });
    
})();
