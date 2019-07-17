host=$1
directory=$2

if [ -n "${SSH_KEY_FILE}" ]
then
    SSH_OPTIONS="${SSH_OPTIONS} -i ${SSH_KEY_FILE}"
    echo $SSH_OPTIONS
fi

rsync -av -e "ssh ${SSH_OPTIONS}" index.html dist styles.css fontawesome normalize.css $host:$directory
