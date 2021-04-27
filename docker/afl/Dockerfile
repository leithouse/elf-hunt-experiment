FROM zjuchenyuan/afl

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get update
RUN apt-get install -y nodejs sqlite3 gdb


RUN mkdir /git-repos && cd /git-repos &&\
  git clone https://gitlab.com/rc0r/exploitable &&\
  cd exploitable &&\
  python2 setup.py install

RUN cd /git-repos &&\
  git clone  https://gitlab.com/rc0r/afl-utils &&\
  cd afl-utils &&\
  git checkout v1.35a &&\
  pip3 install https://gitlab.com/rc0r/exploitable/-/archive/experimental/exploitable-experimental.tar.gz#egg=exploitable-1.32-rcor &&\
  pip3 install twitter &&\
  pip3 install simplejson &&\
  pip3 install .


