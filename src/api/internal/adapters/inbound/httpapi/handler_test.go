package httpapi_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"some-handle-stuff/internal/adapters/inbound/httpapi"
	"some-handle-stuff/internal/core/domain"
)

type stubService struct{}

func (stubService) Create(_ context.Context, title string) (domain.Task, error) {
	return domain.NewTask("1", title)
}
func (stubService) Get(context.Context, string) (domain.Task, error) {
	return domain.Task{}, domain.ErrTaskNotFound
}
func (stubService) Complete(context.Context, string) (domain.Task, error) {
	return domain.Task{}, domain.ErrTaskNotFound
}
func (stubService) List(context.Context) ([]domain.Task, error) { return []domain.Task{}, nil }
func (stubService) Delete(context.Context, string) error        { return domain.ErrTaskNotFound }

func do(method, path, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	httpapi.NewHandler(stubService{}).ServeHTTP(rec, req)
	return rec
}

func TestStatusCodes(t *testing.T) {
	cases := []struct {
		name, method, path, body string
		want                     int
	}{
		{"create ok", "POST", "/tasks", `{"title":"x"}`, http.StatusCreated},
		{"create empty title", "POST", "/tasks", `{"title":""}`, http.StatusBadRequest},
		{"create bad json", "POST", "/tasks", `{`, http.StatusBadRequest},
		{"list", "GET", "/tasks", "", http.StatusOK},
		{"get not found", "GET", "/tasks/9", "", http.StatusNotFound},
		{"complete not found", "POST", "/tasks/9/complete", "", http.StatusNotFound},
		{"delete not found", "DELETE", "/tasks/9", "", http.StatusNotFound},
		{"health", "GET", "/healthz", "", http.StatusOK},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := do(c.method, c.path, c.body).Code; got != c.want {
				t.Fatalf("got %d, want %d", got, c.want)
			}
		})
	}
}
