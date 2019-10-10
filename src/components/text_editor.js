import { TextButton } from './buttons';


const TextFileEditor = (options) => {

  const editFilename = options && options.editFilename === false ? false : true;

  const textFileEditor = document.createElement('div');
  textFileEditor.classList.add('text-file-editor');

  let currentText = "";
  let filename = "";

  const header = document.createElement('div');
  header.classList.add('text-file-editor__header');
  header.innerText = "Text File Editor";
  textFileEditor.appendChild(header);

  if (editFilename) {
    const filenamePrompt = document.createElement('div');
    filenamePrompt.innerText = "Filename:";
    textFileEditor.appendChild(filenamePrompt);

    const filenameInput = document.createElement('input');
    filenameInput.addEventListener('keyup', (e) => {
      filename = e.target.value;
    });
    textFileEditor.appendChild(filenameInput);
  }

  const saveButton = TextButton("Save");
  saveButton.addEventListener('click', (e) => {
    textFileEditor.dispatchEvent(new CustomEvent('save', {
      bubbles: true,
      detail: {
        filename,
        text: currentText,
      },
    }));
  });
  textFileEditor.appendChild(saveButton);

  const exitButton = TextButton("Exit");
  exitButton.addEventListener('click', (e) => {
    textFileEditor.dispatchEvent(new CustomEvent('exit', {
      bubbles: true,
    }));
  });
  textFileEditor.appendChild(exitButton);


  const textEditor = TextEditor(options);
  textEditor.addEventListener('update', (e) => {
    currentText = e.detail.text;
  });
  textFileEditor.appendChild(textEditor);

  return textFileEditor;
};


const TextEditor = (options) => {
  const textEditor = document.createElement('div');
  textEditor.classList.add('text-editor');

  const textArea = document.createElement('textarea');
  textArea.classList.add('text-editor__textarea');
  textArea.setAttribute('spellcheck', false);
  textArea.addEventListener('input', (e) => {
    textEditor.dispatchEvent(new CustomEvent('update', {
      bubbles: true,
      detail: {
        text: e.target.value,
      },
    }));
  });
  textEditor.appendChild(textArea);

  if (options && options.initialText) {
    textArea.value = options.initialText;
  }

  return textEditor;
};


export {
  TextFileEditor,
};
