FROM zjuchenyuan/afl

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get update
RUN apt-get install -y nodejs gdb lcov

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

RUN cd /git-repos &&\
  git clone https://sourceware.org/git/binutils-gdb.git &&\
  cd binutils-gdb &&\
  git checkout binutils-2_36-branch

RUN cd /git-repos &&\
  git clone https://github.com/mrash/afl-cov.git &&\
  cd /usr/local/bin &&\
  ln -s /git-repos/afl-cov/afl-cov

# make binutils has errors, but it builds enough for readelf
RUN mkdir /binutils-gcov &&\
  cd /binutils-gcov &&\
  LIBS=-lgcov CFLAGS='-fprofile-arcs -ftest-coverage' CC=gcc CXX=g++ /git-repos/binutils-gdb/configure &&\
  make -i -j 4
