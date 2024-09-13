class link {
    constructor (id, title, length, desc) {
        this.id = id
        this.title = title
        this.length = length
        this.desc = desc
        this.properties = []
        this.points = 0
        this.attributes = []
        this.prominence = {}
        this.attributions = {}
    }
    property (p) {
        for (let prop of this.properties) {
            if (prop.prop == p) {
                return (prop.value)
            }
        }
        return ([])
    }
    getAttributes () {
        for (let prop of this.properties) {
            if (prop.prop == "P0") {
                continue
            }
            this.attributes = this.attributes.concat (prop.value)
            for (let val of prop.value) {
                if (!Object.keys(this.prominence).includes (val)) {
                    this.prominence[val] = 0
                }
            }
        }
        this.attributes = [...new Set(this.attributes)]
        return this.attributes
    }
}

class target extends link {
    constructor (data) {
        super(data.id, data.title, data.length)
        this.properties = data.properties
        this.getAttributes()
        this.ranking = []
        this.relavence = {}
        //add a thing that measures how relevent each thing is, in order to help getting to the final thing.
    }
    
    compare (against, prevPath) {
        against.points = 0
        let standardMult = 0
        let relatedMult = 0
        if (against.id == this.id) {
            //console.log ("Found!")
            //prevPath.push (against.title)
            //console.log (prevPath)
            return (true)
        }
        let stdNum = 0
        let relNum = 0
        against.getAttributes ()
        let pointInfo = {}
        
        /*
        if (against.property('P0').length != 0) {
            stdNum = 1.5*Math.min (against.properties.length-1, this.properties.length-1)
            relNum = Math.min (against.property("P0").length, this.attributes.length)

            relatedMult = (relNum/(relNum+stdNum))/Math.min (against.property("P0").length, this.attributes.length)
            against.points += relatedMult*(against.property("P0").filter(value => this.attributes.includes(value)).length)
            
            pointInfo.relation = relatedMult*(against.property("P0").filter(value => this.attributes.includes(value)).length)
            pointInfo.relationMatch = against.property("P0").filter(value => this.attributes.includes(value))

            pointInfo.stdNum = stdNum
            pointInfo.relNum = relNum

            standardMult = (stdNum/(relNum+stdNum))/Math.min (against.properties.length-1, this.properties.length-1)
        } else*/ {
            stdNum = 1.5*Math.min (against.properties.length, this.properties.length-1)
            relNum = Math.min (against.attributes.length, this.property("P0").length)

            relatedMult = (stdNum/(relNum+stdNum))/Math.min (against.attributes.length, this.property("P0").length)
            
            against.points += relatedMult*(against.attributes.filter(value => this.property("P0").includes(value)).length)
            pointInfo.relation = against.points
            pointInfo.relationMatch = against.attributes.filter(value => this.property("P0").includes(value))

            

            standardMult = (relNum/(relNum+stdNum))/Math.min (against.properties.length, this.properties.length-1)
        }
        let taken = []
        for (let match of pointInfo.relationMatch) {
            if (Object.keys(this.attributions).includes(match)) {
                for (let connectedThing of this.attributions[match]) {
                    if (taken.includes(connectedThing)) {
                        continue
                    }
                    taken.push (connectedThing)
                    this.prominence[connectedThing] += 0.001
                }
            }
        }

        if (stdNum == 0 || relNum == 0) {
            return
        }
        pointInfo.propertyShare = 0
        pointInfo.strongCommon = []
        for (let prop of this.properties) {
            if (prop.prop == "P0") {
                continue
            }
            if (against.property(prop.prop).length == 0) {
                continue
            }
            for (let att of prop.value) {
                let mult = 1
                if (bonusItem.includes (prop.prop)) {
                    mult = 1.5
                }
                if (against.property(prop.prop).includes (att)) {
                    pointInfo.strongCommon.push ([prop.prop, att])
                    against.points += standardMult*mult
                    
                    pointInfo.propertyShare += standardMult*mult
                    this.prominence[att] += 0.95
                    for (let allAtt of prop.value) {
                        this.prominence[allAtt] += 0.05
                    }
                } else {
                    against.points -= standardMult*mult/15
                    pointInfo.propertyShare -= standardMult*mult/15
                }
            }
        }

        against.points += 0.75*standardMult*(against.attributes.length + this.attributes.length - [...new Set(this.attributes.concat (against.attributes))].length)
        pointInfo.attributeShare = 0.75*standardMult*(against.attributes.length + this.attributes.length - [...new Set(this.attributes.concat (against.attributes))].length)

        pointInfo.smallArticle = Math.max (1, 10/(0.5*against.properties.length+5)) * Math.max (1, 4/(against.properties.length))

        against.points /= Math.max (1, 10/(0.5*against.properties.length+5))
        against.points /= Math.max (1, 4/(against.properties.length))

        //against.points *= Math.min(Math.max(against.length/30000, 1), 1.2)

        //pointInfo.sizeBonus = Math.min(Math.max(against.length/30000, 1), 1.2)

        if (countOccorance (prevPath, against.title) <= 3) {
            against.points /= Math.pow(1.75,Math.min(countOccorance (prevPath, against.title), 3))
        } else {
            against.points /= Math.pow(countOccorance (prevPath, against.title)-4, 0.5)+5.5
            against.points -= 0.15*countOccorance (prevPath, against.title)
        }
        
        
        pointInfo.past = Math.pow(1.75,Math.min(countOccorance (prevPath, against.title), 3))

        against.points += countOccorance (this.attributes, against.id)*standardMult*3
        against.points *= Math.pow(1.5,countOccorance (this.attributes, against.id))

        against.points += countOccorance (against.attributes, this.id)*standardMult*3
        against.points *= Math.pow(1.5,countOccorance (against.attributes, this.id))
        
        pointInfo.connectionBonus = countOccorance (this.attributes, against.id) + countOccorance (against.attributes, this.id)

        against.pointInfo = pointInfo

        if (against.title == prevPath[prevPath.length-1]) {
            against.points = 0
        }

        if (against.points <= 0.035) {
            against.points = 0
        }

        

        let start = 0
        let end = this.ranking.length
        let middle = 0

        //mergeInsert into ranking
        while (true) {
            if (this.ranking.length == 0) {
                this.ranking.push (against)
                break
            }
            middle = start + Math.floor((end-start)/2)
            if (this.ranking[middle].points == against.points) {
                if (this.ranking[middle].length == against.length) {
                    this.ranking.splice (middle, 0, against)
                    break
                }
                if (this.ranking[middle].length > against.length) {
                    start = middle
                } else {
                    end = middle
                }
            }
            if (this.ranking[middle].points > against.points) {
                start = middle
            } else {
                end = middle
            }
            if (end - start <= 1) {
                if (this.ranking[start].points > against.points) {
                    this.ranking.splice (end, 0, against)
                } else {
                    this.ranking.splice (start, 0, against)
                }
                break
            }
        }
        if (this.ranking[0] === undefined) {
            console.log (this.ranking)
            alert ("error. Check console.")
        }
    }
    assess () {

    }
    clearRank () {
        this.ranking = []
    }
    clearProminance () {
        for (let [key, value] of Object.entries(this.prominence)) {
            this.prominence[key] = 0
        }
    }
}

const bannedItems = ['Q6173448', 'P1343', 'Q1860', 'Q5', 'Q6581097', 'Q6581072', 'Q4167836', 'P5008', 'Q1486288', 'P1889']

const bonusItem = ['P31', 'P50']

class property {
    constructor (prop, value) {
        this.prop = prop //what the property is
        this.value = value //the value corresponding to the property. should be an array
    }
    addValues (vals) {
        this.value = this.value.concat(vals)
        this.value = [...new Set(this.value)];
    }
}

var ended = false

var canceling = false

var startArticle = false

var endArticle = false

async function initiate (start, end) {
    
    canceling = false
    ended = false
    document.getElementById ("steps").innerHTML = `<div class = "step" id = "currentStep">Reading Article...</div>`
    await createStart()
    document.getElementById ("extraTopText").innerHTML = `Article: 0/150`
    document.getElementById ("returnButton").innerHTML = `Stop`
    document.getElementById("initiate").style.display = "none"
    document.getElementById("titleArea").style.display = "none"
    document.getElementById("entryArea").style.display = "none"
    document.getElementById ("topTag").style.display = "block"
    document.getElementById("steps").style.display = "flex"
    
    
    
    
    changeStatusText ("Getting Properties Of Ending Article...")
    let goal = new target ((await getProperties ([end], true))[0])
    
    let splitAttribute = splitItems (Object.values(goal.attributes), 50)
    let links = {}
    let promises = []
    for (let i = 0; i < splitAttribute.length; i++) {
        promises.push (getData(splitAttribute[i], true).then (function (res) {
            for (let [key, value] of Object.entries (res)) {
                links[key] = value
            }
        }))
    }
    changeStatusText ("Learning About Properties Of Ending Article...")

    await Promise.all(promises)
    for (let key of Object.keys(links)) {
        if (key == goal.id) {
            continue
        }
        let linkifyed = new link (key, "", -1, "")
        linkifyed.properties = links[key]
        linkifyed.getAttributes()
        for (let att of linkifyed.attributes) {
            try {
                goal.attributions[att].push (linkifyed.id)
            } catch (error) {
                goal.attributions[att] = [linkifyed.id]
            }
            
        }
        goal.compare (linkifyed, [], -1)
    }
    for (let rank of goal.ranking) {
        goal.relavence[rank.id] = rank.points * rank.points
    }
    goal.clearRank ()
    goal.clearProminance()
    console.log (goal.attributes)
    //add a function here that adds a thing to display the final properties

    let path = await chooseLink (start, null, goal, [start], {}, 0)
    console.log (path)
    document.getElementById ("returnButton").innerHTML = `Reset`
    ended = true
}

function countOccorance (arr, target) {
    let counter = 0
    for (let thing of arr) {
        if (thing == target) {
            counter++
        }
    }
    return (counter)
}


function cancel () {
    document.getElementById ("returnButton").innerHTML = `Cancelling...`
    canceling = true
    if (ended) {
        reset()
    }
}

async function chooseLink (title, step, goal, path, cache, counter) {
    if (canceling) {
        reset()
        return
    }

    goal.clearRank()
    if (step != null) {
        step.clearRank ()
    }
    changeStatusText ("Reading Article And Extracing Links...")
    //request article to read
    


    let articleInfo = await getBasicInfo([title])
    
    let articleID
    //if (articleInfo.missing === undefined && articleInfo.pageprops != undefined && articleInfo.pageprops.wikibase_item != undefined) {
    if (articleInfo.length != 0){
        articleID = articleInfo[0][1]
        if (goal.attributes.includes(articleID)){
            goal.prominence[articleID] = -999999
        }
    }

    let links = []

    if (Object.keys(cache).includes(articleID)) {
        links = cache[articleID]
    } else {
        let tail = "action=query"
        tail += "&origin=*"
        tail += "&rvprop=content"
        tail += "&format=json"
        tail += "&rvslots=main"
        tail += "&prop=pageprops|revisions"
        tail += "&redirects=1"
        tail += `&titles=${noAnd(title)}`
        let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
        let content = await res.json()
        let article = content.query.pages
        article = article[Object.keys(article)]
        article = article.revisions[0].slots.main["*"]
        
        //console.log (article)

        //read the article and find all the links
        
        let started = false;
        let cur = '';
        for (let i = 0; i < article.length-1; i++) {
            if (started) {
                if (article[i] == "|" || (article[i] == "]" && article[i+1] == "]") || article[i] == "#") {
                    if (!(links.includes (cur)) && cur[2] != (":") && cur[3] != (":") && !cur.startsWith("File:") && !cur.startsWith("Talk:") && !cur.startsWith("Image:")&& !cur.startsWith("Category:") && !cur.startsWith(":") && cur.length != 0){
                        links.push (cur)
                    }
                    started = false
                    continue
                }
                cur += article[i]
                continue
            }
            if (cur == "[" && article[i] == "[") {
                started = true
                cur = ""
                continue
            }
            cur = article[i]
        }


        //extract the Wikidata ID for each linked article. Split links into 50s, limit for each api call
        //get the information about item from Wikidata and filter to only Wikidata entries
        changeStatusText ("Learning About Links...")
        splitLink = splitItems (links, 50)
        links = {}
        let promises = []
        //do the promise.all thing
        for (let i = 0; i < splitLink.length; i++) {
            promises.push (getProperties(splitLink[i], false).then (function (res) {
                for (let lk of res) {
                    links[lk.id] = lk
                }
            }))
        }
        await Promise.all(promises)
    }
    console.log (links)
    
    //compare the similarity of links and load the article for the most similar article
    changeStatusText ("Comparing Links...")
    if (step == null) {
        for (let link of Object.keys(links)){
            if (goal.compare (links[link], path)) {
                console.log (goal)
                finish ()
                path.push (goal.title)
                return (path)
            }
        }
        console.log (goal.ranking[0])
        path.push (goal.ranking[0].title)
    } else {
        for (let link of Object.keys(links)){
            if (links[link].id == goal.id) {
                //goal found
                //console.log (step)
                console.log ("Found!")
                path.push (goal.title)
                finish ()
                return (path)
            }

            if (step.compare (links[link], path)) {
                //step found
                console.log (step.id + " Found!")
                step.ranking[0] = links[link]
                counter = 10000
                break
            }
        }
        console.log (step.ranking[0])
        path.push (step.ranking[0].title)
    }
    
    if (path.length == 151) {
        giveUp()
        return ("Link Limit Reached. Not able to find path")
    }

    if (canceling) {
        reset()
        return
    }
    
    cache[articleID] = links
    //implement the switching of goals
    document.getElementById ("extraTopText").innerHTML = `Article: ${path.length}/150`
    if (step == null) {
        addStep (goal.ranking[0])
        if (counter >= 12) {
            //swap the goal using priminance to a temptarget
            changeStatusText ("Deciding Redirection Article...")
            let newTarget = await redirect (goal.prominence, goal.relavence)
            console.log ("Redirecting To " + newTarget.id + " ...")
            return (chooseLink (goal.ranking[0].title, newTarget, goal, path, cache, 0))
        } else {
            return (chooseLink (goal.ranking[0].title, null, goal, path, cache, counter+Math.max(goal.ranking[0].points, 0.34)))
        }
        
    }
    if (step != null){
        addStep (step.ranking[0])
        if (counter >= 12) {
            for (let [key, item] in Object.values(step.prominence)) {
                if (Object.keys (goal.prominence).includes (key)) {
                    goal.prominence[key] += item
                }
            }
            await returnToGoal ()
            console.log ("Returning to " + goal.title + " ...")
            return (chooseLink (step.ranking[0].title, null, goal, path, cache, 0))
        } else {
            goal.prominence[step.id] += step.ranking[0].points*50 + 1
            return (chooseLink (step.ranking[0].title, step, goal, path, cache, counter+Math.min(Math.max(step.ranking[0].points*2, 0.5), 2)))
        }
    }
}

function changeStatusText (text) {
    document.getElementById ("currentStep").innerHTML = text
}

async function addStep (article) {
    let newElement = `
    <div>${article.title}</div>
    <small>${article.id}, ${article.desc}</small>
    <br>
    <br>
    <small>Score: ${article.points}</small>
    `
    document.getElementById ("currentStep").innerHTML = newElement
    document.getElementById ("currentStep").id = ""
    document.getElementById ("steps").innerHTML += `<div class = "step" id = "currentStep">
        <div>Reading Article...</div>
    </div>`
    
    window.scrollTo(0, document.body.scrollHeight);
}

function giveUp () {
    document.getElementById ("currentStep").innerHTML = "Article Limit Reached. No Path Found."
    document.getElementById ("currentStep").style.borderColor = "red"
    ended = true
    document.getElementById ("returnButton").innerHTML = `Reset`
    window.scrollTo(0, document.body.scrollHeight);
}

async function getBasicInfoFromCode (code) {
    let tail = "action=wbgetentities&"
    tail += "&origin=*"
    tail += "&languages=en"
    tail += "&format=json"
    tail += "&sites=enwiki"
    tail += "&props=descriptions|labels"
    tail += `&ids=${code}`
    let res = await fetch (`https://www.wikidata.org/w/api.php?${tail}`)
    let result = await res.json()
    console.log (result)
    let desc = "(No Description)"
    let title
    if (result.entities[code].descriptions.en != undefined) {
        desc = result.entities[code].descriptions.en.value
    }

    if (result.entities[code].labels.en != undefined) {
        title = result.entities[code].labels.en.value
    }

    return ([code, title, desc])
    
}
async function addRedirect (target) {
    let article = await getBasicInfoFromCode(target.id)
    let newElement = `
    <div>Attempt To Get To "${article[1]}" First...</div>
    <small>${article[0]}, ${article[2]}</small>
    `
    document.getElementById ("currentStep").innerHTML = newElement
    document.getElementById ("currentStep").style.borderColor = "yellow"
    document.getElementById ("currentStep").id = ""
    document.getElementById ("steps").innerHTML += `<div class = "step" id = "currentStep">
        <div>Reading Article...</div>
    </div>`
    
    window.scrollTo(0, document.body.scrollHeight);
}

async function returnToGoal () {
    let newElement = `
    <div>Returning To "${endArticle}"...</div>
    `
    document.getElementById ("currentStep").innerHTML = newElement
    document.getElementById ("currentStep").style.borderColor = "yellow"
    document.getElementById ("currentStep").id = ""
    document.getElementById ("steps").innerHTML += `<div class = "step" id = "currentStep">
        <div>Reading Article...</div>
    </div>`
    
    window.scrollTo(0, document.body.scrollHeight);
}

async function finish () {
    let desc = await getBasicInfo ([endArticle])
    let newElement = `
    <div>${endArticle}</div>
    <small>${desc[0][1]}, ${desc[0][2]}</small>
    <br>
    <br>
    <small>Path Found!</small>
    `
    document.getElementById ("currentStep").innerHTML = newElement
    document.getElementById ("currentStep").style.borderColor = "green"
    document.getElementById ("currentStep").id = ""
    document.getElementById ("returnButton").innerHTML = "Reset"
    window.scrollTo(0, document.body.scrollHeight);
}

function reset () {
    document.getElementById("initiate").style.display = "block"
    document.getElementById("titleArea").style.display = "flex"
    document.getElementById("entryArea").style.display = "flex"
    document.getElementById ("topTag").style.display = "none"
    document.getElementById("steps").style.display = "none"
}

async function createStart () {
    let desc = await getBasicInfo ([startArticle])
    let newElement = `
    <div>${startArticle}</div>
    <small>${desc[0][1]}, ${desc[0][2]}</small>
    <br>
    <br>
    <small>Starting Article</small>
    `
    document.getElementById ("currentStep").innerHTML = newElement
    document.getElementById ("currentStep").id = ""
    document.getElementById ("steps").innerHTML += `<div class = "step" id = "currentStep">
        <div>Reading Article...</div>
    </div>`

    let endDesc = await getBasicInfo ([endArticle])
    document.getElementById("mainTopText").innerHTML = `From <b>${startArticle}</b> (${desc[0][1]}, ${desc[0][2]}) to <b> ${endArticle} </b> (${endDesc[0][1]}, ${endDesc[0][2]})`
}

async function redirect (prominence, relevence) {

    let splitLink = splitItems (Object.keys(prominence), 50)
    let entityData = {}
    let promises = []
    for (let i = 0; i < splitLink.length; i++) {
        promises.push (getData(splitLink[i], false).then (function (res) {
            for (let [key, value] of Object.entries (res)) {
                entityData[key] = value
            }
        }))
    }
    await Promise.all(promises)

    
    //let entityData = await getData (Object.keys(prominence))
    let points = {}

    let maxProminence = Math.max(...Object.values(prominence))+0.1

    for (let key of Object.keys (entityData)) {
        points[key] = Math.pow ((maxProminence - prominence[key])/(Math.pow (maxProminence, 0.5)), 2) * Math.pow((Math.atan (getAttributes (entityData[key]).length/2 - 4)+1.33)/1.75, 2)
        if (prominence[key] < 0) {
            points[key] = 0
        }
    }

    for (let key of Object.keys (entityData)) {
        points[key] *= Math.pow(relevence[key], 1.5)
    }
    changeStatusText ("Ranking Articles...")
    let rank = []
    for (let [key, value] of Object.entries (points)) {
        let start = 0
        let end = rank.length
        let middle = 0
        while (true) {
            if (rank.length == 0) {
                rank.push ([key, value])
                break
            }
            middle = start + Math.floor((end-start)/2)
            if (rank[middle][1] == value) {
                rank.splice (middle, 0, [key, value])
                break
            }
            if (rank[middle][1] > value) {
                start = middle
            } else {
                end = middle
            }
            if (end - start <= 1) {
                if (rank[start][1] > value) {
                    rank.splice (end, 0, [key, value])
                } else {
                    rank.splice (start, 0, [key, value])
                }
                break
            }
        }
    }
    changeStatusText ("Learning About New Target...")
    //console.log (rank)
    let topLink = new link (rank [0][0], "", -1, "")
    topLink.properties = (await getData ([topLink.id], true))[topLink.id]
    topEntity = new target (topLink)
    await addRedirect (topEntity)
    return (topEntity)
}

function splitItems (links, quantity) {
    let splitLink = []
    let temp = []
    let j = 0
    for (let i = 0; i < links.length; i++) {
        if (j%quantity == 0 && i != 0) {
            splitLink.push (temp)
            temp = []
        }
        if (!links[i].startsWith("Category:") && !links[i].startsWith(":") ) {
            temp.push (links[i])
            j++
        }
            
        if (i == links.length-1 && temp.length != 0) {
            splitLink.push (temp)
        }
    }

    return (splitLink)
}

async function getData (ids, forceRelated) {
    let tail = "action=wbgetentities&"
    tail += "&origin=*"
    tail += "&languages=en"
    tail += "&format=json"
    tail += "&sites=enwiki"
    tail += "&props=claims"
    tail += `&ids=${merge(ids)}`
    let res = await fetch (`https://www.wikidata.org/w/api.php?${tail}`)

    let returnVar = {}
    res = await res.json()
    let extras = {}
    for (const [item, props] of Object.entries(res.entities)) {
        returnVar[item] = []
        for (const [prop, values] of Object.entries (props.claims)) {
            if (bannedItems.includes (prop)){
                continue
            }
            let cleanValues = []
            for (let value of values) {
                if (value.mainsnak.datatype == "wikibase-item" && value.mainsnak.snaktype == "value") {
                    if (!bannedItems.includes (value.mainsnak.datavalue.value.id)) {
                        cleanValues.push (value.mainsnak.datavalue.value.id)
                    }
                }
            }
            if (cleanValues.length == 0) {
                continue
            }
            returnVar[item].push (new property (prop, cleanValues))
        }
        let relatedThings = 0
        for (let prop of returnVar[item]) {
            relatedThings += prop.value.length
        }
        if (forceRelated) {
            extras[item] = returnVar[item]
            returnVar[item].push (new property ("P0", []))
        }
    }
    
    let extraData = []
    let directory = {}
    for (const [item, props] of Object.entries (extras)) {
        for (let prop of props) {
            extraData = extraData.concat (prop.value)
            for (let value of prop.value) {
                try {
                    directory[value].push (item)
                } catch (error) {
                    directory[value] = [item]
                }
            }
        }
    }
    
    extraData = [...new Set(extraData)];
    
    for (let i = extraData.length-1; i >= 0; i--) {
        if (ids.includes (extraData[i])) {
            for (let target of directory[extraData[i]]) {
                returnVar[target][returnVar[target].length-1].addValues (getAttributes (returnVar[extraData[i]]))
            }
            extraData.splice (i, 1)
        }
    }

    splitedData = splitItems (extraData, 50)

    let promises = []
    for (let set of splitedData) {
        promises.push(getRelated (set).then (function (res) {
            for (const [item, props] of Object.entries(res)) {
                for (let target of directory[item]) {
                    returnVar[target][returnVar[target].length-1].addValues (props)
                }
            }
        }))
    }
    await Promise.all(promises)
    
    return (returnVar)
}


function noAnd (input) {
    return (input.replaceAll ("&", "%26"))
}

async function getRelated (ids) {
    let tail = "action=wbgetentities&"
    tail += "&origin=*"
    tail += "&languages=en"
    tail += "&format=json"
    tail += "&sites=enwiki"
    tail += "&props=claims"
    tail += `&ids=${merge(ids)}`
    let res = await fetch (`https://www.wikidata.org/w/api.php?${tail}`)

    let returnVar = {}
    res = await res.json()

    for (const [item, props] of Object.entries(res.entities)) {
        returnVar[item] = []
        if (props.missing != undefined) {
            continue
        }
        for (const [prop, values] of Object.entries (props.claims)) {
            if (props.missing != undefined) {
                continue
            }
            let cleanValues = []
            for (let value of values) {
                if (value.mainsnak.datatype == "wikibase-item" && value.mainsnak.snaktype == "value") {
                    cleanValues.push (value.mainsnak.datavalue.value.id)
                }
            }
            if (cleanValues.length == 0) {
                continue
            }
            returnVar[item] = returnVar[item].concat (cleanValues)
        }
    }

    return (returnVar)
}

async function getProperties (articles, full) {
    let tail = "action=query"
    tail += "&origin=*"
    tail += "&format=json&"
    tail += "&prop=pageprops|revisions"
    tail += "&rvprop=size"
    tail += "&redirects=1"
    tail += `&titles=${merge(articles)}`
    let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
    let content = await res.json()

    content = content.query.pages

    var returnVar = []

    if (content === undefined || content === null) {
        return ([])
    }
    
    for (const [key, value] of Object.entries(content)) {
        if (value.missing === undefined && value.pageprops != undefined && value.pageprops.wikibase_item != undefined) {
            returnVar.push (new link (value.pageprops.wikibase_item, value.title, value.revisions[0].size, value.pageprops["wikibase-shortdesc"]))
        }
    }

    let keys = []
    for (let item of returnVar) {
        keys.push (item.id)
    }
    if (keys.length == 0) {
        return ([])
    }
    keys = await getData (keys, full)

    for (let item of returnVar) {
        item.properties = keys[item.id]
    }
    return (returnVar)
    //console.log (content)
}



function merge (items) {
    let returnVar = ""
    for (let item of items){
        returnVar += item.replaceAll ("&", "%26") + "|"
    }
    return (returnVar.substring (0, returnVar.length - 1))
}


function getAttributes (properties) {
    let returnVar = []
    for (let prop of properties) {
        if (prop.prop == "P0") {
            continue
        }
        returnVar = returnVar.concat (prop.value)
    }
    returnVar = [...new Set(returnVar)]
    return returnVar
}

async function getDesc (titles) {
    if (titles.length == 0) {
        return ([])
    }
    let tail = "action=query"
    tail += "&origin=*"
    tail += "&format=json"
    tail += "&prop=pageprops"
    tail += "&redirects=1"
    tail += `&titles=${noAnd(merge(titles))}`
    let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
    let content = await res.json()
    let returnVar = []
    for (const [item, props] of Object.entries(content.query.pages)) {
        if (props.missing != undefined) {
            continue
        }
        if (props.pageprops.wikibase_item == undefined) {
            continue
        }
        returnVar.push ([props.title, props.pageprops["wikibase-shortdesc"]])
    }
    
    //let descs = content.query.pages
    //article = article[Object.keys(article)].pageprops.wikibase-shortdesc

    return (returnVar)
}


async function getBasicInfo (titles) {
    if (titles.length == 0) {
        return ([])
    }
    let tail = "action=query"
    tail += "&origin=*"
    tail += "&format=json"
    tail += "&prop=pageprops"
    tail += "&redirects=1"
    tail += `&titles=${noAnd(merge(titles))}`
    let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
    let content = await res.json()
    let returnVar = []
    for (const [item, props] of Object.entries(content.query.pages)) {
        if (props.missing != undefined) {
            returnVar.push (["Missing!", "Missing!", "Missing!"])
        }
        if (props.pageprops.wikibase_item == undefined || props.pageprops.wikibase_item == undefined) {
            returnVar.push (["No Wikidata Item!", "No Wikidata Item!", "No Wikidata Item!"])
            continue
        }
        if (props.pageprops["wikibase-shortdesc"] === undefined) {
            returnVar.push ([props.title, props.pageprops["wikibase_item"], "(No Description)"])
        } else {
            returnVar.push ([props.title, props.pageprops["wikibase_item"], props.pageprops["wikibase-shortdesc"]])
        }
        
    }

    return (returnVar)
}

async function getStartInfo (title) {
    let tail = "action=query"
    tail += "&origin=*"
    tail += "&rvprop=content"
    tail += "&format=json"
    tail += "&rvslots=main"
    tail += "&prop=pageprops|revisions"
    tail += "&redirects=1"
    tail += `&titles=${noAnd(title)}`
    let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
    let content = await res.json()
    let article = content.query.pages
    article = article[Object.keys(article)]

    let articleID
    if (article.missing === undefined && article.pageprops != undefined && article.pageprops.wikibase_item != undefined) {
        articleID = article.pageprops.wikibase_item
    } else {
        return (false)
    }

    let links = []

    article = article.revisions[0].slots.main["*"]
    
    let started = false;
    let cur = '';
    for (let i = 0; i < article.length-1; i++) {
        if (started) {
            if (article[i] == "|" || (article[i] == "]" && article[i+1] == "]") || article[i] == "#") {
                if (!(links.includes (cur)) && cur[2] != (":") && cur[3] != (":") && !cur.startsWith("File:") && !cur.startsWith("Talk:") && !cur.startsWith("Image:")&& !cur.startsWith("Category:") && !cur.startsWith(":") && cur.length != 0){
                    links.push (cur)
                }
                started = false
                continue
            }
            cur += article[i]
            continue
        }
        if (cur == "[" && article[i] == "[") {
            started = true
            cur = ""
            continue
        }
        cur = article[i]
    }
    
    return[article.length, links.length]
}

async function articleSearch (title) {
    let tail = "action=opensearch"
    tail += "&origin=*"
    tail += "&format=json&"
    tail += `&search=${title}`
    tail += "&limit=5"
    tail += "&namespace=0"
    let res = await fetch (`https://en.wikipedia.org/w/api.php?${tail}`)
    let articles = await res.json()
    articles = articles[1]
    let desc = await getDesc (articles)
    let sorted = []
    for (let article of articles) {
        for (let thing of desc) {
            if (thing[0] == article) {
                sorted.push (thing)
                break
            }
        }
    }
    return (sorted)
}

function checkStatus () {
    if (startArticle != false && endArticle != false) {
        document.getElementById("initiate").disabled = false
    } else {
        document.getElementById("initiate").disabled = true
    }
}


document.getElementById ("end").addEventListener("input", async function (e) {
    if (document.getElementById("end").value == "") {
        document.getElementById ("endComplete").innerHTML = ""
        return
    }
    let matches = await articleSearch (document.getElementById("end").value)
    console.log (matches)
    
    document.getElementById ("endComplete").innerHTML = ""
    if (matches.length == 0) {
        return
    }
    for (let match of matches) {
        document.getElementById ("endComplete").innerHTML += `<option value="${match[0]}">${match[1]}</option>`
    }
})

document.getElementById ("start").addEventListener("input", async function (e) {
    if (document.getElementById("start").value == "") {
        document.getElementById ("startComplete").innerHTML = ""
        return
    }
    let matches = await articleSearch (document.getElementById("start").value)
    console.log (matches)
    
    document.getElementById ("startComplete").innerHTML = ""
    if (matches.length == 0) {
        return
    }
    for (let match of matches) {
        document.getElementById ("startComplete").innerHTML += `<option value="${match[0]}">${match[1]}</option>`
    }
})



/*
document.addEventListener('keydown', (e) => {
    eventSource = e.key ? 'input' : 'list'
    console.log (eventSource == 'list')
    if (eventSource == 'list') {
        setTimeout (document.getElementById ("end").blur(), 100)
    }
})
*/

document.getElementById ("end").addEventListener("focusout", async function (e) {
    let title = document.getElementById ("end").value
    if (title == "") {
        endArticle = false
        document.getElementById("endData").innerHTML = ``
        checkStatus ()
        return
    }
    if (title == endArticle) {
        checkStatus ()
        return
    }
    let desc = await getBasicInfo ([title])
    if (desc.length == 0) {
        endArticle = false
        document.getElementById("endData").innerHTML = `Article not found or has no Wikidata item`
        return
    }
    document.getElementById("endData").innerHTML = document.getElementById("endData").innerHTML = `
    <small>
        ${desc[0][1]}, ${desc[0][2]}
    </small>
    <br>
    <br>
    Loading...
    `

    title = desc[0][0]
    desc = desc[0][2]
    console.log (title)
    
    document.getElementById ("end").value = title
    
    let goal = new target ((await getProperties ([title], true))[0])
    
    document.getElementById("endData").innerHTML = `
    <small>
        ${goal.id}, ${desc}
    </small>
    <br>
    <br>
    <small>
        Numbers of Attributes: ${goal.attributes.length}
    </small>
    <br>
    <small>
        Numbers of Related Things: ${goal.property("P0").length}
    </small>
    `
    endArticle = title
    checkStatus ()
    //console.log (goal)
})

document.getElementById ("start").addEventListener("focusout", async function (e) {
    let title = document.getElementById ("start").value
    if (title == "") {
        startArticle = false
        document.getElementById("startData").innerHTML = ``
        checkStatus ()
        return
    }
    if (title == startArticle) {
        checkStatus ()
        return
    }
    let desc = await getBasicInfo ([title])
    if (desc.length == 0) {
        startArticle = false
        document.getElementById("startData").innerHTML = `Article not found or has no Wikidata item`
        return
    }
    document.getElementById("startData").innerHTML  = `
    <small>
        ${desc[0][1]}, ${desc[0][2]}
    </small>
    <br>
    <br>
    Loading...
    `

    title = desc[0][0]
    id = desc[0][1]
    desc = desc[0][2]
    
    console.log (title)
    document.getElementById ("start").value = title
    
    let article = await getStartInfo (title)
    
    document.getElementById("startData").innerHTML = `
    <small>
        ${id}, ${desc}
    </small>
    <br>
    <br>
    <small>
        Length of Article: ${article[0]}
    </small>
    <br>
    <small>
        Number of Links: ${article[1]}
    </small>
    `
    startArticle = title
    checkStatus ()
})

