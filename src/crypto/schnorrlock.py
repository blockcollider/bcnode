

import random
import sys

N=89
g=3


x = random.randint(1,97)

X = pow(g,x) % N

y = random.randint(1,97)

Y = pow(g,y) % N

print "Peggy (the Prover) generates these values:"
print "x(secret)=\t",x
print "N=\t\t",N
print "X=\t\t",X

print "\nPeggy generates a random value (y):"
print "y=",y

print "\nPeggy computes Y = g^y (mod N) and passes to Victor:"

print "Y=",Y

print "\nVictor generates a random value (c) and passes to Peggy:"

c = random.randint(1,97)
print "c=",c
print "\nPeggy calculates z = y.x^c (mod N) and send to Victor (the Verifier):"

z = (y + c * x)

print "z=",z

print "\nVictor now computes val=g^z (mod N) and (Y X^c (mod N)) and determines if they are the same\n"

val1= pow(g,z) % N
val2= (Y * (X**c))  % N

print "val1=\t",val1,
print " val2=\t",val2

if (val1==val2):
    print "Peggy has proven that he knows x"
else:
    print "Failure to prove"

