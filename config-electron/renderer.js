const { ipcRenderer } = require('electron');

let utilsConfig = [];

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.on('send-config', (event, config, toto) => {
    utilsConfig = config;

    const configList = []
    for (const item in utilsConfig) {
      if (utilsConfig[item].editable)
        configList.push({ key: item, ...utilsConfig[item] })
    }

    const divConfigList = document.querySelector('.c__config-list')

    configList.forEach(field => {
      const divElement = document.createElement('div')
      divElement.classList.add('c__c__elem')

      const divLibelle = document.createElement('div')
      divLibelle.classList.add('c__c__e__libelle')
      divLibelle.textContent = field.description

      const divField = document.createElement('div')
      divField.classList.add('c__c__e__field')
      const input = document.createElement('input')
      if (field.type === 'number')
        input.type = 'number'
      else
        input.type = 'text'
      input.name = field.key
      input.value = field.value
      divField.append(input)

      divElement.appendChild(divLibelle)
      divElement.appendChild(divField)

      divConfigList.append(divElement)
    })

    const validateButton = document.getElementById('validate-button');

    if (validateButton) {
      validateButton.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.c__config-list input');
        const updatedConfig = Array.from(inputs).map(input => ({
          key: input.name,
          value: input.value
        }));

        ipcRenderer.send('close-window', updatedConfig);
      });
    } else {
      console.error('Bouton ou champ input introuvable');
    }
  });
});