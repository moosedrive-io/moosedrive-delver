import m from 'mithril';


const TextButton = (text) => {
  const button = document.createElement('button');
  button.classList.add('text-button');
  button.innerText = text;
  return button;
};

const IconButton = (iconClasses) => {
  const dom = document.createElement('span');
  dom.classList.add('icon-button');
  const icon = document.createElement('i');
  iconClasses.forEach(c => {
    icon.classList.add(c);
  });

  dom.appendChild(icon);

  return dom;
};

const DeleteButton = () => {
  return IconButton(['fas', 'fa-times']);
};


const OpenExternalButton = (url) => {
  const dom = document.createElement('span');
  dom.classList.add('open-external-btn');
  const link = document.createElement('a');
  link.classList.add('open-external-btn__link');
  link.setAttribute('href', url);
  link.setAttribute('target', '_blank');
  dom.appendChild(link);
  const icon = IconButton(['fas', 'fa-external-link-alt']);
  link.appendChild(icon);
  return dom;
};


const DownloadButton = (itemType, url) => {
  const dom = document.createElement('span');
  dom.classList.add('download-btn');
  const downloadLink = document.createElement('a');
  downloadLink.classList.add('file');
  // TODO: adding the '/' here is a hack to allow downloads even
  // when there's a redirect from the server. Need to properly
  // handle including params on redirect in the server code.
  const params = itemType === 'file' ? '?download=true' : '/?download=true' 
  downloadLink.setAttribute('href', url + params);
  downloadLink.setAttribute('title', "Download");
  const downloadButton = IconButton(['btn', 'fas', 'fa-download']);
  downloadLink.appendChild(downloadButton);
  dom.appendChild(downloadLink);
  return dom;
};


const NewFolderButton = () => {
  const dom = document.createElement('span');

  const icon = document.createElement('i');
  icon.classList.add('icon-button', 'fas', 'fa-folder-plus');
  icon.addEventListener('click', (e) => {
    dom.dispatchEvent(new CustomEvent('new-folder-button-click', {
      bubbles: true,
    }));
  });
  dom.appendChild(icon);

  return dom;
};


export {
  DeleteButton,
  OpenExternalButton,
  NewFolderButton,
  TextButton,
  IconButton,
  DownloadButton,
};
