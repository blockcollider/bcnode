#!/usr/bin/env sh
set -e

usage () {
    cat <<-EOF
        Usage: $(basename $0) -u url [-n filename] [-d dest] [-x] [-c checksum] [-p program]

        Download, check and install a file from a URL using cURL.
        cURL will be installed from package repositories if absent, and removed after execution.

        Options:
          -u    URL of the file
          -n    Name of the file once installed (default: same as source)
          -d    Directory to move the file to (default: '/usr/local/bin')
          -x    Make the file executable
          -c    File checksum
          -p    Program used for checking file checksum (default: 'sha1sum')
          -h    Display this help and exit
    EOF
    exit 1
}

# set defaults
fileDest=/usr/local/bin
checksumProgram=sha1sum

# OS checks
osName="$(awk -F'=' '$1 == "ID" { print $2 }' /etc/os-release)"
case "$osName" in
    debian|ubuntu)
        packCmdPre="apt-get update -qq"
        packCmdInst="apt-get install -qq --no-install-recommends"
        packCmdDel="apt-get purge --auto-remove -qq"
        packCmdClean="rm -rf /var/lib/apt/lists/*"
        ;;
    alpine)
        packCmdPre=":"
        packCmdInst="apk --no-cache add"
        packCmdDel="apk del"
        packCmdClean=":"
        ;;
    *)
        echo "error: OS $osName unsupported" >&2
        exit 1
        ;;
esac

# read flags
if ! O="$(getopt -- :u:n:d:xc:p:h "$@")"; then
    echo "error: Wrong arguments" >&2
    exit 1
fi
eval set -- "$O"
while true; do
    case "$1" in
    -u)
        url="$2"
        shift 2
        ;;
    -n)
        fileName="$2"
        shift 2
        ;;
    -d)
        fileDest="$2"
        shift 2
        ;;
    -x)
        makeExec=true
        shift
        ;;
    -c)
        checksum="$2"
        shift 2
        ;;
    -p)
        checksumProgram="$2"
        shift 2
        ;;
    -h)
        usage
        ;;
    --)
        shift
        break
        ;;
    *)
        echo "error: Invalid option: $1" >&2
        exit 1
        ;;
    esac
done

if [ -z "${url:-}" ]; then
    echo "error: Option -u is required" >&2
    exit 1
fi

# install curl if required
which curl 2>&1 >/dev/null && curlPresent=true
if [ -z "${curlPresent:-}" ]; then
    $packCmdPre >/dev/null
    $packCmdInst curl >/dev/null
fi

# install ca-certificates if required
scheme=$(echo $url | awk -F ":" '{print $1}')
which update-ca-certificates 2>&1 >/dev/null && caCertsPresent=true
if [ "${scheme:-}" = "https" -a -z "${caCertsPresent:-}" ]; then
    $packCmdPre >/dev/null
    $packCmdInst ca-certificates >/dev/null
fi

# set file name if unset
if [ -z "${fileName:-}" ]; then
    fileName=$(echo $url | awk -F "/" '{print $NF}' | awk -F "?" '{print $1}')
fi

# create tmpdir to download file
tmpdir=$(mktemp -d)
cd "$tmpdir"

# fetch file passed as URL
curl -fsSL "$url" -o "$fileName"
if [ ! -z "${makeExec:-}" ]; then
    chmod +x "$fileName"
fi

# check checksum if passed as option
if [ ! -z "${checksum:-}" ]; then
    echo "$checksum  $fileName" | "$checksumProgram" -c -
fi

# install file to its final location and delete tmpdir
mkdir -p "$fileDest"
mv "$fileName" "$fileDest"
cd - >/dev/null
rm -rf "$tmpdir"

# uninstall curl if we installed it earlier
if [ -z "${curlPresent:-}" ]; then
    $packCmdDel curl >/dev/null
    $packCmdClean
fi

# uninstall ca-certificates if we installed it earlier
if [ -z "${caCertsPresent:-}" ]; then
    $packCmdDel ca-certificates >/dev/null
    $packCmdClean
fi
