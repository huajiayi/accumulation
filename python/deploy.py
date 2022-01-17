import paramiko
import os
import time
import shutil


host = '192.168.11.22'
port = 22
user = 'root'
password = 'andlinks2021'
dist_dir = '/root/NFT-Store-Manager'


def sftp_exec_nohup(command):
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(host, 22, user, password=password)
        session = ssh_client.invoke_shell()
        session.send(command)
        time.sleep(1)
    except Exception as e:
        print(e)


def sftp_exec_command(command):
    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(host, 22, user, password=password)
        std_in, std_out, std_err = ssh_client.exec_command(command)
        for line in std_out:
            print(line.strip('\n'))
        ssh_client.close()
    except Exception as e:
        print(e)


def sftp_upload_file(server_path, local_path):
    try:
        t = paramiko.Transport((host, 22))
        t.connect(username=user, password=password)
        sftp = paramiko.SFTPClient.from_transport(t)
        sftp.put(local_path, server_path)
        t.close()
    except Exception as e:
        print(e)


if __name__ == '__main__':
    
    os.system('npm run build')
    shutil.make_archive('dist', 'zip', './dist')
    sftp_exec_command('rm -rf {}/dist.zip'.format(dist_dir))
    sftp_upload_file('{}/dist.zip'.format(dist_dir), 'dist.zip')
    sftp_exec_command('rm -rf {}/dist'.format(dist_dir))
    sftp_exec_command('unzip -o {}/dist.zip -d {}'.format(dist_dir, dist_dir))
    sftp_exec_command('chmod -R 755 {}/dist'.format(dist_dir))
    os.system('del dist.zip')