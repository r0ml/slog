package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"log"
	"net/http"
	"reflect"
	"regexp"
	"strconv"
	_ "strings"
	"time"
)

func structFromItem(value interface{}, x map[string]*dynamodb.AttributeValue) {
	v := reflect.ValueOf(value)
	vs := v.Elem()

	for i := 0; i < vs.NumField(); i++ {
		f := vs.Field(i)
		if !(f.IsValid() && f.CanSet()) {
			continue
		}
		n := vs.Type().Field(i).Name
		tag := vs.Type().Field(i).Tag.Get("dynamo")
		nn := n
		if tag != "" {
			nn = tag
		}
		av := x[nn]
		if av == nil {
			log.Print("no value ", n)
			continue
		}
		t := f.Kind()
		switch t {
		// s.Kind() == reflect.Int
		case reflect.String:
			ff := *av.S
			f.SetString(ff)
		case reflect.Int64, reflect.Int, reflect.Int32, reflect.Int16, reflect.Int8:
			ff := *av.N
			fn, _ := strconv.ParseInt(ff, 10, 64)
			f.SetInt(fn)
		case reflect.Uint, reflect.Uint64, reflect.Uint32, reflect.Uint16, reflect.Uint8:
			ff := *av.N
			fn, _ := strconv.ParseUint(ff, 10, 64)
			f.SetUint(fn)
		case reflect.Float32, reflect.Float64:
			ff := *av.N
			fn, _ := strconv.ParseFloat(ff, 64)
			f.SetFloat(fn)
		case reflect.Struct:
			tt := f.Type()
			var tm time.Time
			switch tt {
			case reflect.TypeOf(tm):
				a, _ := strconv.ParseInt(*av.N, 10, 64)
				a = -a
				b := time.Unix(a/int64(time.Second), a%int64(time.Second))
				f.Set(reflect.ValueOf(b))
			default:
				log.Fatal("structFromItem cannot handle type ", tt)
			}
		default:
			log.Fatal("cannot handle kind ", t)
		}
	}
}

func itemFromStruct(value interface{}) map[string]*dynamodb.AttributeValue {
	result := map[string]*dynamodb.AttributeValue{}

	v := reflect.ValueOf(value)
	for i := 0; i < v.NumField(); i++ {
		f := v.Field(i)
		n := v.Type().Field(i).Name
		nn := n
		tag := v.Type().Field(i).Tag.Get("dynamo")
		if tag != "" {
			nn = tag
		}
		t := f.Type()
		var m string
		var mt time.Time
		switch t {
		case reflect.TypeOf(m):
			ff := f.String()
			if len(ff) > 0 {
				result[nn] = &dynamodb.AttributeValue{S: &ff}
			}
		case reflect.TypeOf(mt):
			ft := f.Interface().(time.Time)
			ftx := -ft.UnixNano()
			if ftx != 6795364578871345152 {
				fts := fmt.Sprint(ftx)
				result[nn] = &dynamodb.AttributeValue{N: &fts}
			}

		default:
			log.Fatal("itemFromStruct cannot handle type", t)
		}
	}
	return result
	// How do I calculate the value of the Id ?
}

func setCORS(w http.ResponseWriter, req *http.Request) {
	o := req.Header.Get("Origin")
	m, _ := regexp.MatchString("://localhost(:|$)", o)
	if m {
		//	if strings.Contains(o, "://localhost:") {
		w.Header().Set("Access-Control-Allow-Origin", o)
	}
}

func hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there, I love %s!", r.URL.Path[1:])
}

func comments(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var t string
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}
	dsvc := dynamodb.New(Session)
	r1, err := dsvc.Query(&dynamodb.QueryInput{
		TableName:              aws.String("comments"),
		KeyConditionExpression: aws.String("PostId = :post"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":post": {S: aws.String(t)},
		},
	})
	fmt.Println("comments", err)
	setCORS(w, r)
	encoder := json.NewEncoder(w)
	var pres []Comment
	for _, x := range r1.Items {
		p := Comment{}
		structFromItem(&p, x)
		pres = append(pres, p)
	}
	var lek string
	if r1.LastEvaluatedKey != nil {
		lek = *r1.LastEvaluatedKey["Time"].N
	}
	z := CommentResults{Items: pres, LastEvaluatedKey: lek}
	encoder.Encode(z)

}

func comment(w http.ResponseWriter, r *http.Request) {
}

func posts(w http.ResponseWriter, req *http.Request) {
	dsvc := dynamodb.New(Session)
	r1, err := dsvc.Scan(&dynamodb.ScanInput{
		TableName: aws.String("posts"),
		IndexName: aws.String("TimeX"),
	})
	fmt.Println("posts ", err)
	setCORS(w, req)
	encoder := json.NewEncoder(w)

	var pres []Post

	for _, x := range r1.Items {
		p := Post{}
		structFromItem(&p, x)
		pres = append(pres, p)
	}

	var lek string
	if r1.LastEvaluatedKey != nil {
		lek = *r1.LastEvaluatedKey["Time"].N
	}
	z := PostResults{Items: pres, LastEvaluatedKey: lek}
	encoder.Encode(z)
}

type CommentResults struct {
	Items            []Comment
	LastEvaluatedKey string
}

type PostResults struct {
	Items            []Post
	LastEvaluatedKey string
}

type Comment struct {
	Body      string
	PostId    string
	Title     string
	CommentId string
	CreatedAt time.Time
	Author    string
}

/*
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
*/

type Post struct {
	PostId    string
	Title     string
	Body      string
	Author    string
	CreatedAt time.Time `dynamo:"Time"`
}

func post(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var t Post
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}
	t.PostId = t.Title

	log.Printf("doPost: %#v\n", t)
	err = doPost(t)

	log.Println("do post ", err)
	encoder := json.NewEncoder(w)

	setCORS(w, req)
	if err != nil {
		// w.Header().Set("header_name", "header_value")
		w.WriteHeader(409)
		encoder.Encode(err)
	} else {
		encoder.Encode("OK")
	}

}

func deletePost(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var t Post
	err := decoder.Decode(&t)
	if err != nil {
		panic("This is not valid JSON")
	}
	t.PostId = t.Title

	log.Printf("deletePost: %#v\n", t)
	// this must also delete the associated comments
	// this is best done by either
	// . a) also deleting the associated comments or
	// . b) changing the database so that the comments
	//      are part of the post
	err = doDeletePost(t)

	log.Println("delete post ", err)
	encoder := json.NewEncoder(w)

	setCORS(w, req)
	if err != nil {
		// w.Header().Set("header_name", "header_value")
		w.WriteHeader(409)
		encoder.Encode(err)
	} else {
		encoder.Encode("OK")
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
	values := itemFromStruct(t)
	/*
		values := map[string]*dynamodb.AttributeValue{}
		if t.Email != "" {
			values["Email"] = &dynamodb.AttributeValue{S: &t.Email}
		}
	*/
	r1, err := dsvc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String("users"),
		Key:       values,
	})
	fmt.Println(err)
	setCORS(w, req)
	encoder := json.NewEncoder(w)
	a := r1.Item
	b := User{}
	structFromItem(&b, a)

	encoder.Encode(b)

	/*
		if len(a) > 0 {
			p := *a["Password"]
			if t.Password == *p.S {
				encoder.Encode(userFromDb(a))
				return
			}
		}
		encoder.Encode(map[string]string{})
	*/
}

/*
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
*/

type User struct {
	Email    string `dynamo:"test 1" jsonx:"clem"`
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
	values := itemFromStruct(t)
	/*	values := map[string]*dynamodb.AttributeValue{}
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
	*/
	_, err := dsvc.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String("users"),
		Item:                values,
		ConditionExpression: aws.String("attribute_not_exists(Email)"),
	})
	return err
}

func doComment(t Comment) error {
	dsvc := dynamodb.New(Session)
	t.CreatedAt = time.Now()
	values := itemFromStruct(t)
	_, err := dsvc.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String("comments"),
		Item:                values,
		ConditionExpression: aws.String("attribute_not_exists(CommentId)"),
	})
	return err
}

func doDeletePost(t Post) error {
	t = Post{PostId: t.PostId}
	log.Println("doDeletePost: => ", t)
	values := itemFromStruct(t)
	log.Println("doDeletePost: ", values)
	dsvc := dynamodb.New(Session)
	_, err := dsvc.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String("posts"),
		Key:       values,
	})
	return err
}

func doPost(t Post) error {
	dsvc := dynamodb.New(Session)
	t.CreatedAt = time.Now()
	values := itemFromStruct(t)
	/*
		values := map[string]*dynamodb.AttributeValue{}
		values["PostId"] = &dynamodb.AttributeValue{S: &t.PostId}
		values["Author"] = &dynamodb.AttributeValue{S: &t.Author}
		values["Title"] = &dynamodb.AttributeValue{S: &t.Title}
		values["Body"] = &dynamodb.AttributeValue{S: &t.Body}
		tm := fmt.Sprint(-time.Now().UnixNano())
		values["Time"] = &dynamodb.AttributeValue{N: &tm}
	*/
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
	http.HandleFunc("/deletePost", deletePost)
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

	r1, err = dsvc.CreateTable(&dynamodb.CreateTableInput{
		TableName: aws.String("comments"),
		AttributeDefinitions: []*dynamodb.AttributeDefinition{
			&dynamodb.AttributeDefinition{
				AttributeName: aws.String("PostId"),
				AttributeType: aws.String("S"),
			},
			&dynamodb.AttributeDefinition{
				AttributeName: aws.String("CommentId"),
				AttributeType: aws.String("S"),
			},
		},
		KeySchema: []*dynamodb.KeySchemaElement{
			&dynamodb.KeySchemaElement{
				AttributeName: aws.String("PostId"),
				KeyType:       aws.String("HASH"),
			},
			&dynamodb.KeySchemaElement{
				AttributeName: aws.String("CommentId"),
				KeyType:       aws.String("SORT"),
			},
		},
		ProvisionedThroughput: &dynamodb.ProvisionedThroughput{
			ReadCapacityUnits:  aws.Int64(1),
			WriteCapacityUnits: aws.Int64(1),
		},
	})

	for i := 1; i < 100; i++ {
		err = doPost(Post{Title: fmt.Sprintf("this is a post %d", i), Body: fmt.Sprintf("this is a test post %d\n", i), Author: "r0ml", PostId: fmt.Sprintf("%d", i)})
		for j := 1; j < 10; j++ {
			err = doComment(Comment{Title: fmt.Sprintf("this is comment number %d on post %d", j, i), Body: fmt.Sprintf("this is the contents of the comment for post %d comment %d", i, j), Author: "r0ml", PostId: fmt.Sprintf("%d", i), CommentId: fmt.Sprintf("%d", j)})
		}
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
