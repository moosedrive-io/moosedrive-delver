host=$1
directory=$2

rsync -av index.html dist styles.css fontawesome normalize.css $host:$directory
