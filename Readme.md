
# Morphogenèse urbaine : Définition du projet 

* [Aim of the project](#aim-of-the-project)
* [Project stakeholders]()
  * [Project design and development]()
  * [Supervision and validation of the project]()
* [Installing and running this demonstration]()

![image](./img/exampleCreation.png)

This project is part of action 14 (Think and do Tank) of the [TIGA project](https://www.tank-ssi.org/) led by the Metropole of Lyon. It aims to set up a partnership between two research laboratories involved in the Think and do Tank: the Image and Information Systems Computing Laboratory ([LIRIS](https://liris.cnrs.fr/)) and the Environment, City and Society Laboratory ([EVS](https://umr5600.cnrs.fr/fr/accueil/)). Organised within the [LabEx IMU](https://imu.universite-lyon.fr/), the urban morphogenesis project seeks to initiate a cross-disciplinary approach to urban issues by mobilising research players for the benefit of local authorities and citizens.  

## Aim of the project  

The aim of the urban morphogenesis project is to develop a digital tool, in the form of a web interface, to visualise in 3D the evolution of the urban form of the Lyon metropolitan area over the period 1950-2020. The aim is to visualise changes linked to changes in industrial work. The aim will be to observe how the development of industry has transformed the Lyon metropolitan area by showing how urban forms have changed and emerged to deal with the problems associated with changes in work.  

This modelling shows that there is a degree of stability for businesses in the area, but at the same time industry has changed, particularly in the city centre.    

This project is an opportunity to (re)question 3D temporal visualisations of an area. We want to show not just the variations in buildings, but also their internal functions. Visualising the evolution of the territory in all its forms allows us to become aware of the subtle evolution, or otherwise, of certain districts. It is then that, beyond a simple web interface, a decision-making tool takes shape. 

## Project stakeholders 
### Project design and development: 

 - [Clarisse Aubert](https://imu.universite-lyon.fr/clarisse-aubert--290503.kjsp?RH=1671099790039), Geomaticien ingeneer, LabEx IMU ; 

 - [Corentin Gautier](https://corentingaut.github.io/), PhD student in computer sciences, LabEx IMU, LIRIS ; 

 - [Éléonore Gendry](https://fr.linkedin.com/in/eleonore-gendry), PhD student in human sciences, LabEx IMU, EVS. 

### Supervision and validation of the project: 

- [Gilles Gesquière](https://liris.cnrs.fr/page-membre/gilles-gesquiere), Professor at the University Lyon 2 ; 

- [Véronique Tessier](https://imu.universite-lyon.fr/veronique-teissier--283505.kjsp?RH=1671099790039), Project Manager, TIGA – Action 14 ; 

- [Jean-Yves Toussaint](https://fr.linkedin.com/in/jean-yves-toussaint-268029b6), Professor at INSA. 

## Installing and running this demonstration
### Strabon-context
To configure the demo and the components that support it edit the `.env` [file](./.env) to be launched with docker-compose. By default the following ports are used by the following services:
- 8996: `PostGIS`
- 8997: `Strabon`

### Build Images and run containers
First, build the PostGIS and Strabon docker images and run their containers:
```
docker-compose up
```

**Note:** Make sure to set the `sparqlModule/url` port in the `./assets/config/server/sparql_server.json` file to the same port for the _Strabon_ container declared in the `.env` file.

### Launch UD-Viz demo
Then install and run the UD-Viz application:
```
npm i
npm run debug
```
