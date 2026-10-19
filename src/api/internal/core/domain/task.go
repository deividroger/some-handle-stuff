package domain

import "errors"

var (
	ErrInvalidTitle = errors.New("title is required")
	ErrTaskNotFound = errors.New("task not found")
)

type Task struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

func NewTask(id, title string) (Task, error) {
	if title == "" {
		return Task{}, ErrInvalidTitle
	}
	return Task{ID: id, Title: title}, nil
}
