package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"net/http"
	"os"
	"regexp"
	"strconv"
	_ "strings"
	"time"
)

func hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there, I love %s!", r.URL.Path[1:])
}

func comments(w http.ResponseWriter, r *http.Request) {
}

func comment(w http.ResponseWriter, r *http.Request) {
}

func posts(w http.ResponseWriter, req *http.Request) {
	/*
		decoder := json.NewDecoder(req.Body) // do I even care about this? -- or is it a GET ?
		var t User
		err := decoder.Decode(&t)
		if err != nil {
			panic("This is not valid JSON")
		}
	*/

	dsvc := dynamodb.New(Session)
	r1, err := dsvc.Scan(&dynamodb.ScanInput{
		TableName: aws.String("posts"),
		IndexName: aws.String("TimeX"),
	})
	fmt.Println(err)

	o := req.Header.Get("Origin")

	m, err := regexp.MatchString("://localhost(:|$)", o)
	if m {
		//	if strings.Contains(o, "://localhost:") {
		w.Header().Set("Access-Control-Allow-Origin", o)
	}
	encoder := json.NewEncoder(w)

	var pres []Post

	for _, x := range r1.Items {
		pres = append(pres, postFromItem(x))
	}

	var lek string
	if r1.LastEvaluatedKey != nil {
		lek = *r1.LastEvaluatedKey["Time"].N
	}
	z := PostResults{Items: pres, LastEvaluatedKey: lek}
	fmt.Println(z)

	y, err := json.Marshal(z)
	fmt.Println(y, err)

	encod := json.NewEncoder(os.Stderr)
	encod.Encode(z)
	encoder.Encode(z)
}

type PostResults struct {
	Items            []Post
	LastEvaluatedKey string
}

type Comment struct {
	Body   string
	PostId string
	Author string
}

func postFromItem(x map[string]*dynamodb.AttributeValue) Post {
	a, _ := strconv.ParseInt(*x["Time"].N, 10, 64)
	a = -a
	b := time.Unix(a/int64(time.Second), a%int64(time.Second))
	fmt.Println(b)

	return Post{Title: *x["Title"].S,
		Body:      *x["Body"].S,
		Author:    *x["Author"].S,
		PostId:    *x["PostId"].S,
		CreatedAt: b,
	}
}

type Post struct {
	PostId    string
	Title     string
	Body      string
	Author    string
	Comments  []Comment
	CreatedAt time.Time
}

func post(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var t Post
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}
	dsvc := dynamodb.New(Session)
	values := map[string]*dynamodb.AttributeValue{}

	// How do I calculate the value of the Id ?

	if t.Title != "" {
		values["Title"] = &dynamodb.AttributeValue{S: &t.Title}
	}
	if t.Body != "" {
		values["Body"] = &dynamodb.AttributeValue{S: &t.Body}
	}

	o := req.Header.Get("Origin")

	m, err := regexp.MatchString("://localhost(:|$)", o)
	if m {
		//	if strings.Contains(o, "://localhost:") {
		w.Header().Set("Access-Control-Allow-Origin", o)
	}

	r1, err := dsvc.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String("posts"),
		Item:                values,
		ConditionExpression: aws.String("attribute_not_exists(Email)"),
	})
	encoder := json.NewEncoder(w)
	encoder.Encode(map[string]string{})

	if err != nil {
		// w.Header().Set("header_name", "header_value")
		w.WriteHeader(409)
		fmt.Fprint(w, err)
	} else {
		fmt.Fprint(w, r1)
	}

}

func login(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var t User
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}

	dsvc := dynamodb.New(Session)
	values := map[string]*dynamodb.AttributeValue{}
	if t.Email != "" {
		values["Email"] = &dynamodb.AttributeValue{S: &t.Email}
	}
	r1, err := dsvc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String("users"),
		Key:       values,
	})
	fmt.Println(err)
	fmt.Println(r1)

	o := req.Header.Get("Origin")

	m, err := regexp.MatchString("://localhost(:|$)", o)
	if m {
		//	if strings.Contains(o, "://localhost:") {
		w.Header().Set("Access-Control-Allow-Origin", o)
	}
	encoder := json.NewEncoder(w)
	a := r1.Item
	if len(a) > 0 {
		p := *a["Password"]
		if t.Password == *p.S {
			encoder.Encode(userFromDb(a))
			return
		}
	}
	encoder.Encode(map[string]string{})
}

func userFromDb(f map[string]*dynamodb.AttributeValue) User {
	g, ok := f["Gravatar"]
	var gs string
	if ok {
		gs = *g.S
	}

	return User{Email: *f["Email"].S,
		Username: *f["Username"].S,
		Gravatar: gs,
	}
}

type User struct {
	Email    string
	Username string
	Password string
	Gravatar string
}

func register(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var t User
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}
	err = doRegister(t)
	if err != nil {
		// w.Header().Set("header_name", "header_value")
		w.WriteHeader(409)
		fmt.Fprint(w, err)
	} else {
		fmt.Fprint(w, "OK")
	}
}

func doRegister(t User) error {
	dsvc := dynamodb.New(Session)
	values := map[string]*dynamodb.AttributeValue{}
	if t.Email != "" {
		values["Email"] = &dynamodb.AttributeValue{S: &t.Email}
	}
	if t.Username != "" {
		values["Username"] = &dynamodb.AttributeValue{S: &t.Username}
	}
	if t.Password != "" {
		values["Password"] = &dynamodb.AttributeValue{S: &t.Password}
	}
	if t.Gravatar != "" {
		values["Gravatar"] = &dynamodb.AttributeValue{S: &t.Gravatar}
	}

	_, err := dsvc.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String("users"),
		Item:                values,
		ConditionExpression: aws.String("attribute_not_exists(Email)"),
	})
	return err
}

func doPost(t Post) error {
	dsvc := dynamodb.New(Session)
	values := map[string]*dynamodb.AttributeValue{}
	values["PostId"] = &dynamodb.AttributeValue{S: &t.PostId}
	values["Author"] = &dynamodb.AttributeValue{S: &t.Author}
	values["Title"] = &dynamodb.AttributeValue{S: &t.Title}
	values["Body"] = &dynamodb.AttributeValue{S: &t.Body}
	tm := fmt.Sprint(-time.Now().UnixNano())
	values["Time"] = &dynamodb.AttributeValue{N: &tm}

	_, err := dsvc.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String("posts"),
		Item:                values,
		ConditionExpression: aws.String("attribute_not_exists(PostId)"),
	})
	return err
}

var Session *session.Session
var profile string
var region string

var prov bool

func main() {
	flag.BoolVar(&prov, "provision", false, "Provision?")
	Session = getMyConfig()
	flag.Parse()
	if prov {
		provision()
		return
	}
	http.HandleFunc("/comments", comments)
	http.HandleFunc("/comment", comment)
	http.HandleFunc("/posts", posts)
	http.HandleFunc("/post", post)
	http.HandleFunc("/hello", hello)
	http.HandleFunc("/login", login)
	http.HandleFunc("/register", register)
	http.ListenAndServe(":9044", nil)
}

func provision() {
	// aws dynamodb create-table --table-name users --attribute-definitions AttributeName=Email,AttributeType=S --key-schema AttributeName=Email,KeyType=HASH --endpoint-url http://localhost:9043 --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
	dsvc := dynamodb.New(Session)
	r1, err := dsvc.CreateTable(&dynamodb.CreateTableInput{
		TableName: aws.String("users"),
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			&dynamodb.AttributeDefinition{
				AttributeName: aws.String("Email"),
				AttributeType: aws.String("S"),
			},
		},
		KeySchema: []*dynamodb.KeySchemaElement{
			&dynamodb.KeySchemaElement{
				AttributeName: aws.String("Email"),
				KeyType:       aws.String("HASH"),
			},
		},
		ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
			ReadCapacityUnits:  aws.Int64(1),
			WriteCapacityUnits: aws.Int64(1),
		},
	})
	fmt.Println("create table", err, r1)
	err = doRegister(User{Email: "r0ml@mac.com", Username: "r0ml", Password: "r0ml"})
	fmt.Println("register r0ml", err)
	err = doRegister(User{Email: "ther0ml@gmail.com", Username: "other", Password: "other"})
	fmt.Println("register other", err)

	r1, err = dsvc.CreateTable(&dynamodb.CreateTableInput{
		TableName: aws.String("posts"),
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			&dynamodb.AttributeDefinition{
				AttributeName: aws.String("PostId"),
				AttributeType: aws.String("S"),
			},
			&dynamodb.AttributeDefinition{
				AttributeName: aws.String("Time"),
				AttributeType: aws.String("N"),
			},
		},
		KeySchema: []*dynamodb.KeySchemaElement{
			&dynamodb.KeySchemaElement{
				AttributeName: aws.String("PostId"),
				KeyType:       aws.String("HASH"),
			},
		},
		GlobalSecondaryIndexes: []*dynamodb.GlobalSecondaryIndex{
			&dynamodb.GlobalSecondaryIndex{
				IndexName: aws.String("TimeX"),
				KeySchema: []*dynamodb.KeySchemaElement{
					&dynamodb.KeySchemaElement{
						AttributeName: aws.String("Time"),
						KeyType:       aws.String("HASH"),
					},
				},
				Projection: &dynamodb.Projection{ProjectionType: aws.String("ALL" /* "KEYS_ONLY" */)},
				ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
					ReadCapacityUnits:  aws.Int64(1),
					WriteCapacityUnits: aws.Int64(1),
				},
			},
		},
		ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
			ReadCapacityUnits:  aws.Int64(1),
			WriteCapacityUnits: aws.Int64(1),
		},
	})
	fmt.Println("create table", err, r1)
	for i := 1; i < 100; i++ {
		err = doPost(Post{Title: fmt.Sprintf("this is a post %d", i), Body: fmt.Sprintf("this is a test post %d\n", i), Author: "r0ml", PostId: fmt.Sprintf("%d", i)})
		fmt.Println("post", err)
	}
}

func getMyConfig() *session.Session {
	return session.New(&aws.Config{
		Credentials: credentials.NewStaticCredentials("123", "123", ""),
		Region:      aws.String("us-east-1"),
		Endpoint:    aws.String("http://127.0.0.1:9043"),
		// LogLevel:    &ld,
		// HTTPClient:  &http.Client{Transport: &LogRoundTripper{http.DefaultTransport}},
	})
}
